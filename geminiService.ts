import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types.ts";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractReceiptData = async (base64Image: string): Promise<Partial<ExtractedData>> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      // FIX: Updated model to a recommended one for multi-modal tasks.
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this image. It is likely a photo of a DIGITAL WEIGHING SCALE and/or handwritten notes.
            
            PRIMARY OBJECTIVE:
            1. Find the large number on the digital scale display. This is the 'weightGoldTotal'.
            2. If there are handwritten notes, look for specific purities (8k, 333, 18k, 750, 22k, 916, 24k, 999 etc.).
               - If a note says "4.85g 18k", extract 4.85 into 'weightGold18k'.
               - DO NOT subtract this from the Total yourself. The system assumes (Total - Specifics = 14k).
               - So if Scale says 100g and Note says "10g 18k", return Total=100 and 18k=10.
            
            SECONDARY OBJECTIVE:
            - Extract receipt/customer details if visible (Receipt #, Name, SSN, IBAN).
            - If no customer details are found, leave them blank.
            
            MAPPING RULES:
            - Scale Reading -> weightGoldTotal
            - 8k / 333 -> weightGold8k
            - 18k / 750 -> weightGold18k
            - 22k / 916 -> weightGold22k
            - 24k / 999 (Gold) -> weightGold24k
            
            - Silver 800 -> weightSilver800
            - Silver 830 -> weightSilver830
            - Silver 925 -> weightSilver925
            - Silver 999 -> weightSilver999
            
            CRITICAL: 
            - If only a scale number is visible (e.g. 50.0), return it as 'weightGoldTotal'. 14k is the default purity if no other specific purity is indicated for the total.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            receiptNumber: { type: Type.STRING },
            firstName: { type: Type.STRING },
            lastName: { type: Type.STRING },
            clientSSN: { type: Type.STRING },
            phoneNumber: { type: Type.STRING },
            email: { type: Type.STRING },
            iban: { type: Type.STRING },
            amountEuro: { type: Type.NUMBER },
            
            // Gold
            weightGoldTotal: { type: Type.NUMBER, description: "The primary reading from the scale display" },
            weightGold8k: { type: Type.NUMBER },
            weightGold18k: { type: Type.NUMBER },
            weightGold22k: { type: Type.NUMBER },
            weightGold24k: { type: Type.NUMBER },
            
            // Silver
            weightSilverTotal: { type: Type.NUMBER },
            weightSilver800: { type: Type.NUMBER },
            weightSilver813: { type: Type.NUMBER }, 
            weightSilver830: { type: Type.NUMBER },
            weightSilver925: { type: Type.NUMBER },
            weightSilver999: { type: Type.NUMBER },

            location: { type: Type.STRING },
            date: { type: Type.STRING },
          },
          required: ["weightGoldTotal"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      
      // Clean Receipt Number (remove non-digits, e.g. "A123" -> "123")
      const rawReceipt = data.receiptNumber || '';
      const cleanReceipt = rawReceipt.replace(/\D/g, '');

      return {
        ...data,
        receiptNumber: cleanReceipt,
        // Ensure defaults if null
        weightGoldTotal: data.weightGoldTotal || 0,
        weightGold8k: data.weightGold8k || 0,
        weightGold18k: data.weightGold18k || 0,
        weightGold22k: data.weightGold22k || 0,
        weightGold24k: data.weightGold24k || 0,
        weightSilverTotal: data.weightSilverTotal || 0,
        weightSilver800: data.weightSilver800 || 0,
        weightSilver813: data.weightSilver813 || 0,
        weightSilver830: data.weightSilver830 || 0,
        weightSilver925: data.weightSilver925 || 0,
        weightSilver999: data.weightSilver999 || 0
      } as Partial<ExtractedData>;
    }
    throw new Error("No text returned from model");

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};
