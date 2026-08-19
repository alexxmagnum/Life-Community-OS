/**
 * Professional trades share Business Profile + category.
 * No ProfessionalEntity. Hub trade ids map onto the same commercial domain.
 */

const TRADE_CATEGORIES: Record<string, readonly string[]> = {
  gardening: ["gardening", "service"],
  cleaning: ["service", "maintenance"],
  repairs: ["maintenance", "service"],
  electrician: ["electrician"],
  plumber: ["plumber"],
  carpenter: ["service", "maintenance"],
  painter: ["service"],
  "locksmith-service": ["service"],
  "air-conditioning": ["maintenance", "service"],
  "veterinary-doctor": ["veterinary"],
  waiter: ["service"],
};

export function businessCategoriesForTrade(tradeId: string): readonly string[] {
  return TRADE_CATEGORIES[tradeId.trim()] ?? [tradeId.trim()];
}
