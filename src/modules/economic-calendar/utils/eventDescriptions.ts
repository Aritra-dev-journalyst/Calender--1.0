// src/modules/economic-calendar/utils/eventDescriptions.ts

export type EventType =
    | 'data_release'    // CPI, NFP, GDP etc
    | 'speech'          // "Fed Chair Powell Speaks"
    | 'meeting'         // "FOMC Meeting Minutes"
    | 'report'          // "Financial Stability Review"
    | 'auction'         // "10-y Bond Auction"
    | 'holiday'         // "Bank Holiday"
    | 'unknown';

export type StaticDescriptionResult = {
    description: string;
    whyItMatters: string;
    usualEffect: string;
    frequency: string;
    source: string;
    sourceUrl: string | null;
    eventType: EventType;
};

// ── Event Type Detection ──────────────────────────────────────

export function detectEventType(title: string): EventType {
    const t = title.toLowerCase();

    if (
        t.includes('speaks') ||
        t.includes('speech') ||
        t.includes('testimony') ||
        t.includes('press conference') ||
        t.includes('statement') ||
        t.includes('comments') ||
        t.includes('remarks')
    ) return 'speech';

    if (
        t.includes('meeting minutes') ||
        t.includes('minutes') ||
        t.includes('mpc meeting') ||
        t.includes('fomc meeting') ||
        t.includes('rate decision') ||
        t.includes('interest rate')
    ) return 'meeting';

    if (
        t.includes('review') ||
        t.includes('report') ||
        t.includes('survey') ||
        t.includes('outlook') ||
        t.includes('bulletin') ||
        t.includes('budget release')
    ) return 'report';

    if (
        t.includes('auction') ||
        t.includes('bond') ||
        t.includes('bill') ||
        t.includes('treasury')
    ) return 'auction';

    if (
        t.includes('holiday') ||
        t.includes('bank holiday') ||
        t.includes('public holiday')
    ) return 'holiday';

    return 'data_release';
}

// ── Static Descriptions ───────────────────────────────────────

const SPEECH_DESCRIPTION =
    'A scheduled public appearance by a central bank official or ' +
    'government representative. Markets closely watch these events ' +
    'for hints about future monetary policy decisions, economic outlook, ' +
    'or shifts in official positions. Hawkish comments tend to ' +
    'strengthen the currency while dovish comments tend to weaken it.';

const MEETING_MINUTES_DESCRIPTION =
    'Released minutes from a central bank policy meeting. ' +
    'These documents provide detailed insight into the discussions ' +
    'and reasoning behind recent interest rate decisions. ' +
    'Traders analyze the tone and language for clues about ' +
    'the future direction of monetary policy.';

const BUDGET_DESCRIPTION =
    'A government budget release or fiscal statement outlining ' +
    'planned government spending, taxation policy, and economic ' +
    'forecasts for the coming period. Significant budget announcements ' +
    'can move currency markets if they signal major changes in ' +
    'fiscal policy or economic outlook.';

const AUCTION_DESCRIPTION =
    'A government bond or treasury auction where debt instruments ' +
    'are sold to investors. The yield achieved at auction reflects ' +
    'investor demand for government debt. Poor auction results ' +
    '(low demand, high yield) can weaken the currency while ' +
    'strong results tend to be supportive.';

const STABILITY_REVIEW_DESCRIPTION =
    'A central bank financial stability review or report assessing ' +
    'risks to the financial system. These reports identify potential ' +
    'vulnerabilities in banking, housing, and credit markets. ' +
    'Markets watch for any signals about regulatory changes or ' +
    'systemic risks that might affect monetary policy.';

export function getStaticEventDescription(
    title: string
): StaticDescriptionResult | null {
    const t = title.toLowerCase();
    const eventType = detectEventType(title);

    if (eventType === 'speech') {
        const speakerName = extractSpeakerName(title);
        return {
            description:
                `${speakerName ? speakerName + ' is scheduled to speak publicly. ' : ''}` +
                SPEECH_DESCRIPTION,
            whyItMatters:
                'Central bank official speeches can move currency markets ' +
                'significantly if they signal changes in monetary policy outlook.',
            usualEffect:
                'Hawkish tone (higher rates) = currency strengthens. ' +
                'Dovish tone (lower rates) = currency weakens.',
            frequency: 'Varies — scheduled by central bank calendar',
            source: 'generated',
            sourceUrl: null,
            eventType: 'speech',
        };
    }

    if (eventType === 'meeting') {
        return {
            description: MEETING_MINUTES_DESCRIPTION,
            whyItMatters:
                'Meeting minutes give traders insight into central bank thinking and potential future rate changes.',
            usualEffect:
                'Hawkish minutes = currency strengthens. Dovish minutes = currency weakens.',
            frequency: 'Released weeks after each policy meeting',
            source: 'generated',
            sourceUrl: null,
            eventType: 'meeting',
        };
    }

    if (eventType === 'auction') {
        return {
            description: AUCTION_DESCRIPTION,
            whyItMatters:
                'Bond auction results reflect investor confidence in ' +
                'government finances and can influence interest rates.',
            usualEffect:
                'Strong demand (low yield) = currency positive. ' +
                'Weak demand (high yield) = currency negative.',
            frequency: 'Regular schedule published by treasury',
            source: 'generated',
            sourceUrl: null,
            eventType: 'auction',
        };
    }

    if (eventType === 'holiday') {
        return {
            description:
                'A public or bank holiday. Financial markets in this ' +
                'country will be closed or operating with reduced liquidity. ' +
                'Expect lower trading volumes for currency pairs involving ' +
                'this currency during the holiday period.',
            whyItMatters:
                'Reduced liquidity can lead to wider spreads and ' +
                'unexpected price movements.',
            usualEffect: 'Reduced trading volume and liquidity.',
            frequency: 'Annual',
            source: 'generated',
            sourceUrl: null,
            eventType: 'holiday',
        };
    }

    if (eventType === 'report') {
        if (t.includes('budget')) {
            return {
                description: BUDGET_DESCRIPTION,
                whyItMatters:
                    'Major fiscal policy announcements can significantly ' +
                    'impact currency valuations and bond markets.',
                usualEffect: 'Varies based on content of the budget.',
                frequency: 'Typically annual',
                source: 'generated',
                sourceUrl: null,
                eventType: 'report',
            };
        }

        if (t.includes('stability') || t.includes('financial stability')) {
            return {
                description: STABILITY_REVIEW_DESCRIPTION,
                whyItMatters:
                    'Identifies systemic risks that may influence ' +
                    'future regulatory or monetary policy decisions.',
                usualEffect: 'Usually limited market impact unless major risks are flagged.',
                frequency: 'Typically semi-annual',
                source: 'generated',
                sourceUrl: null,
                eventType: 'report',
            };
        }
    }

    return null;
}

function extractSpeakerName(title: string): string | null {
    const cleaned = title
        .replace(/\s+speaks\s*$/i, '')
        .replace(/\s+speech\s*$/i, '')
        .replace(/\s+testimony\s*$/i, '')
        .trim();

    return cleaned !== title ? cleaned : null;
}
