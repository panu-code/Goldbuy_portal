export enum SaleType {
  Standard = 'Standard',
  Bonus = 'Bonus'
}

export interface ExtractedData {
  // New Fields
  receiptNumber: string; // The red number
  clientSSN: string; // DOB with ending (HETU)
  phoneNumber: string;

  firstName: string;
  lastName: string;
  email: string;
  iban: string;
  amountEuro: number;
  
  // Marketing Info
  marketingChannel: string;
  
  // Gold Weights
  weightGoldTotal: number;
  weightGold8k: number; // New: 8ct / 333
  weightGold18k: number;
  weightGold22k: number;
  weightGold24k: number; // New: 24ct / 999
  // 14k is calculated as Total - (8k + 18k + 22k + 24k)

  // Silver Weights
  weightSilverTotal: number;
  weightSilver800: number;
  weightSilver813: number; // Now the Default/Remainder
  weightSilver830: number;
  weightSilver925: number;
  weightSilver999: number;

  location: string;
  date: string; // YYYY-MM-DD
}

export interface SaleRecord extends ExtractedData {
  id: string;
  userId: string; // To track specific employee (now represents driver ID)
  region: string; // Region of operation (Pohjanmaa, Satakunta, etc.)
  timestamp: number;
  comments: string;
  receiptImageBase64: string | null;
  isPaid: boolean; // New: Has this sale been marked as paid?
  isSentToBank: boolean; // New: Has this sale been included in a bank export file?
}

export interface DailyStats {
  totalSales: number;
  bonusSalesCount: number;
  runningTotalEuro: number;
  // Stats for bonus calculation (Normalized to 14k)
  totalGoldWeightNormalized: number;
  totalGoldCost: number; 
  currentAvgGoldPrice: number;
  estimatedBonusEuro: number;
}