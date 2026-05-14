// src/modules/economic-calendar/domain/types.ts

export type ImpactLevel = 'high' | 'medium' | 'low' | null;

export type EventStatus = 'scheduled' | 'released';

export type EventSource =
    | 'ehsan_historical'
    | 'forexfactory_live';

export type CalendarEventInput = {
    source: EventSource;
    sourceKey: string;
    title: string;
    currency: string | null;
    impact: ImpactLevel;
    eventDay: string | null;
    eventTimeRaw: string | null;
    startsAtUtc: Date | null;
    actual: string | null;
    forecast: string | null;
    previous: string | null;
    detail: string | null;
    status: EventStatus;
    isAllDay: boolean;
    isTentative: boolean;
    parserVersion?: string;
    rawPayload: unknown;
};

export type ParsedCalendarRow = {
    eventDay: string | null;
    eventTimeRaw: string | null;
    currency: string | null;
    impact: string | null;
    title: string;
    actual: string | null;
    forecast: string | null;
    previous: string | null;
    isAllDay: boolean;
    isTentative: boolean;
    rawPayload: unknown;
};

export type SyncRunLog = {
    jobType: string;
    source: string;
    startedAt: Date;
    finishedAt: Date;
    status: 'success' | 'failed' | 'partial';
    rowsSeen: number;
    rowsInserted: number;
    rowsUpdated: number;
    errorMessage: string | null;
};

export type UpsertResult = {
    inserted: number;
    updated: number;
    skipped: number;
};