// src/modules/economic-calendar/ingestion/jobs/alerts.ts

type Severity = 'warning' | 'critical';

export async function sendAlert(
    severity: Severity,
    message: string,
    context: Record<string, unknown> = {}
): Promise<void> {
    // Always log to console
    const logFn = severity === 'critical' ? console.error : console.warn;
    logFn(`[CALENDAR ${severity.toUpperCase()}] ${message}`, context);

    // Send to Slack if webhook is configured
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    const emoji = severity === 'critical' ? '🚨' : '⚠️';

    try {
        await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `${emoji} *Calendar ${severity}*: ${message}`,
                attachments: [
                    {
                        color: severity === 'critical' ? 'danger' : 'warning',
                        text: JSON.stringify(context, null, 2),
                        footer: new Date().toISOString(),
                    },
                ],
            }),
        });
    } catch {
        // Never let alerting crash the job
    }
}