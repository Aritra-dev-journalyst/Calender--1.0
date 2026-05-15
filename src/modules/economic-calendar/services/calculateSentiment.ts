// src/modules/economic-calendar/services/calculateSentiment.ts

import { economicEvents } from "../db/economicEvents.schema";

export type SentimentResult = {
  score: number; // 0 to 100 (strength of the signal)
  bullishPercent: number; // 0 to 100
  label: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  bullishCount: number;
  bearishCount: number;
  totalIndicators: number;
};

// Parses a string like "1.2M", "500K", "-2.3%", "45.0" into a raw number
export function parseEconomicValue(val: string | null): number | null {
  if (!val) return null;
  const cleaned = val.trim().replace(/,/g, '');
  const numStr = cleaned.replace(/[^0-9.-]/g, '');
  if (!numStr) return null;

  let num = parseFloat(numStr);
  if (isNaN(num)) return null;

  if (cleaned.toLowerCase().includes('k')) num *= 1_000;
  if (cleaned.toLowerCase().includes('m')) num *= 1_000_000;
  if (cleaned.toLowerCase().includes('b')) num *= 1_000_000_000;

  return num;
}

export function calculateDailySentiment(events: (typeof economicEvents.$inferSelect)[]): SentimentResult {
  let bullishPoints = 0;
  let bearishPoints = 0;
  let bullishCount = 0;
  let bearishCount = 0;

  for (const event of events) {
    if (!event.actual || (!event.forecast && !event.previous)) continue;

    const actual = parseEconomicValue(event.actual);
    const expected = parseEconomicValue(event.forecast || event.previous);

    if (actual === null || expected === null) continue;
    if (actual === expected) continue; // Neutral

    // Determine weight based on impact
    let weight = 1;
    if (event.impact === 'High') weight = 3;
    if (event.impact === 'Medium') weight = 2;

    // Determine if higher is better. 
    // Usually "Actual > Forecast is good" but some like Unemployment are the opposite.
    let higherIsBetter = true;
    const usualEffect = event.usualEffect?.toLowerCase() || '';
    if (usualEffect.includes('less than') && usualEffect.includes('is good')) {
      higherIsBetter = false;
    } else if (
      event.title.toLowerCase().includes('unemployment') ||
      event.title.toLowerCase().includes('jobless')
    ) {
      higherIsBetter = false;
    }

    const isBullish = higherIsBetter ? actual > expected : actual < expected;

    if (isBullish) {
      bullishPoints += weight;
      bullishCount++;
    } else {
      bearishPoints += weight;
      bearishCount++;
    }
  }

  const totalPoints = bullishPoints + bearishPoints;
  const totalIndicators = bullishCount + bearishCount;

  if (totalIndicators === 0) {
    return { score: 50, bullishPercent: 50, label: 'NEUTRAL', bullishCount: 0, bearishCount: 0, totalIndicators: 0 };
  }

  // Calculate raw bullishness (0 to 100, where 50 is neutral)
  const bullishPercent = Math.round((bullishPoints / totalPoints) * 100);

  // Score is just the bullish percent (0-100)
  const score = bullishPercent;

  let label: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (bullishPercent > 60) label = 'BULLISH';
  else if (bullishPercent < 40) label = 'BEARISH';

  return {
    score,
    bullishPercent,
    label,
    bullishCount,
    bearishCount,
    totalIndicators
  };
}
