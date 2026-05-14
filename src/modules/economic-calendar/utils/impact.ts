// src/modules/economic-calendar/utils/impact.ts

import type { ImpactLevel } from '../domain/types';

export function normalizeImpact(
    raw: string | null | undefined
): ImpactLevel {
    if (!raw) return null;

    const val = raw.toLowerCase().trim();

    if (val.includes('high') || val.includes('red')) return 'high';
    if (val.includes('med') || val.includes('ora')) return 'medium';
    if (val.includes('low') || val.includes('yel')) return 'low';

    return null;
}

export function impactToColor(impact: ImpactLevel): string {
    switch (impact) {
        case 'high': return 'red';
        case 'medium': return 'orange';
        case 'low': return 'yellow';
        default: return 'gray';
    }
}

export function impactScore(impact: ImpactLevel): number {
    switch (impact) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
    }
}