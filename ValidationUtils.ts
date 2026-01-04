/**
 * Validates a Finnish IBAN.
 * Format: FI + 16 digits. Total length 18 characters.
 * Ignores spaces for validation logic, but checks structure.
 */
export const isValidFinnishIBAN = (iban: string): boolean => {
  const cleanIBAN = iban.replace(/\s+/g, '').toUpperCase();
  
  if (!cleanIBAN.startsWith('FI')) return false;
  if (cleanIBAN.length !== 18) return false;
  
  // Check if the remaining characters are digits
  const numbers = cleanIBAN.substring(2);
  return /^\d+$/.test(numbers);
};

export const formatIBAN = (iban: string): string => {
  // Remove non-alphanumeric
  const clean = iban.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Add spaces every 4 characters for readability
  const chunks = clean.match(/.{1,4}/g) || [];
  return chunks.join(' ');
};

/**
 * Calculates the total weight normalized to 14k (585) purity.
 * This allows us to compare mixed batches against a single base price (30€/g for 14k).
 */
export const calculateNormalized14kWeight = (
  weightTotal: number, 
  weight8k: number,
  weight18k: number, 
  weight22k: number,
  weight24k: number,
): number => {
  const w8 = weight8k || 0;
  const w18 = weight18k || 0;
  const w22 = weight22k || 0;
  const w24 = weight24k || 0;
  // Calculate remaining 14k weight
  const w14 = Math.max(0, (weightTotal || 0) - (w8 + w18 + w22 + w24));

  // Ratios based on 585 (14k)
  // 8k (333) -> 333/585 = 0.57...
  // 18k (750) -> 750/585 = 1.28205...
  // 22k (916) -> 916/585 = 1.56581...
  // 24k (999) -> 999/585 = 1.70769...
  const RATIO_8K = 333 / 585;
  const RATIO_18K = 750 / 585;
  const RATIO_22K = 916 / 585;
  const RATIO_24K = 999 / 585;

  return w14 + (w8 * RATIO_8K) + (w18 * RATIO_18K) + (w22 * RATIO_22K) + (w24 * RATIO_24K);
};

export const isBonusSale = (
  price: number, 
  weightGoldTotal: number, 
  weight8k: number,
  weight18k: number,
  weight22k: number,
  weight24k: number,
): boolean => {
  const normalizedWeight = calculateNormalized14kWeight(weightGoldTotal, weight8k, weight18k, weight22k, weight24k);
  
  if (normalizedWeight <= 0) return false;

  // Calculate price per "14k gram"
  const pricePerNormalizedGram = price / normalizedWeight;

  // Bonus condition: Purchase price is under 30€ per 14k gram
  return pricePerNormalizedGram < 30;
};

/**
 * Calculates the estimated bonus amount in Euros.
 * Logic: (Target Price - Actual Price) * Split Share * Weight
 * Current Logic: (40 - Price/g) * 10% * NormalizedWeight
 */
export const calculateBonusAmount = (
  price: number,
  weightGoldTotal: number,
  weight8k: number,
  weight18k: number,
  weight22k: number,
  weight24k: number,
): number => {
  const normalizedWeight = calculateNormalized14kWeight(weightGoldTotal, weight8k, weight18k, weight22k, weight24k);
  
  if (normalizedWeight <= 0) return 0;
  if (!isBonusSale(price, weightGoldTotal, weight8k, weight18k, weight22k, weight24k)) return 0;

  const pricePerGram = price / normalizedWeight;
  
  // Bonus Formula: (40 - ActualPricePerGram) * 10% * Grams
  const margin = 40 - pricePerGram;
  return Math.max(0, margin * 0.10 * normalizedWeight);
};