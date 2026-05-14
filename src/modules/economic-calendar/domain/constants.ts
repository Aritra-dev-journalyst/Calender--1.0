// src/modules/economic-calendar/domain/constants.ts

export const PARSER_VERSION = '2025-06-v1' as const;

export const FF_TIMEZONE = 'America/New_York' as const;

export const FF_BASE_URL = 'https://www.forexfactory.com' as const;

export const MAJOR_CURRENCIES = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CAD',
    'AUD',
    'NZD',
    'CHF',
] as const;

export const IMPACT_LEVELS = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
} as const;

export const SYNC_INTERVALS = {
    FORWARD_SYNC_MS: 30 * 60 * 1000,       // 30 minutes
    RECONCILE_SYNC_MS: 4 * 60 * 60 * 1000, // 4 hours
} as const;

export const INVESTING_COUNTRY_IDS: Record<string, number> = {
    USD: 5,
    GBP: 4,
    EUR: 72,
    JPY: 35,
    CAD: 6,
    AUD: 25,
    NZD: 43,
    CHF: 12,
} as const;