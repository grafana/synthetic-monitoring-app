import type { InsightsCheckMeta, InsightsResponse } from 'datasource/responses.types';

// -- Origins (used to track where assistant interactions come from) --

export const ORIGINS = {
  investigate: 'grafana/synthetic-monitoring/insights/investigate',
  overlapping: 'grafana/synthetic-monitoring/insights/overlapping',
  duplicates: 'grafana/synthetic-monitoring/insights/duplicates',
  usage: 'grafana/synthetic-monitoring/insights/usage',
  performance: 'grafana/synthetic-monitoring/insights/performance',
  recommendations: 'grafana/synthetic-monitoring/insights/recommendations',
  alertSetup: 'grafana/synthetic-monitoring/insights/alert-setup',
} as const;

// -- Issue type labels (used in performance investigation) --

export const ISSUE_LABELS: Record<string, string> = {
  uptime: 'low uptime',
  flapping: 'flapping behavior',
  regional: 'regional anomalies',
  latency: 'latency degradation',
};

// -- Page-level context (registered via providePageContext for sidebar assistant) --

export const PAGE_CONTEXT_TITLE = 'Synthetic Monitoring Insights';

export const PAGE_CONTEXT_DESCRIPTION = 'Current state of this tenant\'s Synthetic Monitoring setup.';

export const PAGE_CONTEXT_INSTRUCTIONS = `You are analyzing Synthetic Monitoring insights. The context contains:
- checks: metadata (job, target, type, frequency, enabled) keyed by check ID
- usage: check counts, probe distribution, alerting gaps, limits
- performance: flapping checks, regional anomalies, latency degradation, uptime warnings
- recommendations: low-value checks, overlapping targets, duplicates

When investigating, correlate across categories. A check appearing in multiple categories is more urgent.
Suggest specific actions: reduce frequency, add probes, set up alerts, consolidate duplicates.
Be concise. Use bullet points. Prioritize by impact.`;

// -- Performance investigation --

export function buildInvestigationPrompt({
  issueType,
  checkName,
  checkMeta,
  allIssues,
}: {
  issueType: string;
  checkName: string;
  checkMeta: InsightsCheckMeta | undefined;
  allIssues: string[];
}) {
  const label = ISSUE_LABELS[issueType] ?? issueType;
  return `Investigate ${label} on "${checkName}" (target: ${checkMeta?.target}, type: ${checkMeta?.type}, frequency: ${(checkMeta?.frequency_ms ?? 0) / 1000}s).

All issues for this check:
${allIssues.map((i) => `- ${i}`).join('\n')}

Focus on the ${label} issue. What's the likely root cause? Are the other issues related? What should I do?`;
}

export function buildInvestigationSystemPrompt(issueType: string, data: InsightsResponse) {
  const label = ISSUE_LABELS[issueType] ?? issueType;
  return `You are a Synthetic Monitoring expert analyzing a Grafana Cloud stack.

Full insights data for this tenant:
${JSON.stringify(data, null, 0)}

Response format:
- Start with a 1-sentence **Summary** of the ${label} problem
- Under **Root Cause**, explain the most likely reason. Use the full insights data to correlate with other checks or patterns.
- If other issues are present for this check, explain under **Related Issues** how they connect
- Under **Recommended Actions**, list steps as blockquotes (> 1. **Action** -- explanation)
Keep it under 200 words. Use markdown.`;
}

// -- Recommendations (shared base for duplicates, overlapping, general) --

const RECO_RESPONSE_FORMAT = `Response format:
- Start with a 1-sentence **Summary** of the situation
- Under **Analysis**, explain which items need attention and why. Use the full insights data to correlate with other checks or patterns.
- Under **Recommended Actions**, list steps as blockquotes (> 1. **Action** -- explanation)
Keep it under 200 words. Use markdown.
When referring to checks, use their job name (not numeric IDs). Never start a sentence with a number that could be confused with an ID.`;

const RECO_ACTIONS_INSTRUCTIONS = `
IMPORTANT: After the markdown, output a structured action block so the UI can render "Do it" buttons.
Format it EXACTLY like this (use real check IDs from the data):

\`\`\`json:actions
[
  {"action": "disable", "check_ids": [123, 456], "label": "Disable redundant copies"},
  {"action": "disable", "check_ids": [789], "label": "Disable low-value check"}
]
\`\`\`

Rules for the actions block:
- Use "disable" for enabled checks that should be turned off.
- Use "delete" for disabled checks that should be removed entirely.
- Each entry should map to one of your recommended actions.
- Only include actions where you are confident. Do NOT include non-actionable advice (like "investigate" or "add probes") -- those belong in the markdown only.
- Skip actions where there are no matching check IDs in the data.`;

export function buildRecoSystemPrompt(data: InsightsResponse) {
  return `You are a Synthetic Monitoring expert analyzing a Grafana Cloud stack.

${RECO_RESPONSE_FORMAT}

${RECO_ACTIONS_INSTRUCTIONS}

Full insights data:
${JSON.stringify(data, null, 0)}`;
}

// -- Alert setup --

const ALERT_DEFAULTS = `Available alert types and their defaults per check type:
- ALL check types: ProbeFailedExecutionsTooHigh (threshold: 1, period: "5m")
- HTTP checks: HTTPRequestDurationTooHighAvg (threshold: 300 ms, period: "5m"), TLSTargetCertificateCloseToExpiring (threshold: 30 days, no period)
- Ping checks: PingRequestDurationTooHighAvg (threshold: 50 ms, period: "5m")
- DNS checks: DNSRequestDurationTooHighAvg (threshold: 100 ms, period: "5m")
- TCP checks: TLSTargetCertificateCloseToExpiring (threshold: 30 days, no period)
- Scripted/Browser/GRPC/MultiHTTP/Traceroute: only ProbeFailedExecutionsTooHigh`;

export function buildAlertSetupPrompt(checksWithoutAlerts: Array<{ id: number; job: string; type: string }>) {
  const checkList = checksWithoutAlerts.map((c) => `- "${c.job}" (id: ${c.id}, type: ${c.type})`).join('\n');
  return `I have ${checksWithoutAlerts.length} checks without any alerts configured. Propose appropriate alerts for each one:

${checkList}

For each check, recommend which alert types to enable and what thresholds to use. Use defaults unless performance data suggests otherwise.`;
}

export function buildAlertSetupSystemPrompt(data: InsightsResponse) {
  return `You are a Synthetic Monitoring expert setting up per-check alerts for a Grafana Cloud stack.

${ALERT_DEFAULTS}

Guidelines:
- Every check should get ProbeFailedExecutionsTooHigh at minimum.
- Add type-specific duration alerts where applicable (HTTP, Ping, DNS).
- Add TLS certificate expiry alerts for HTTPS targets and TCP checks.
- If the insights data shows latency or uptime issues for a check, adjust thresholds accordingly (e.g. if P95 is 500ms, set duration alert at 800ms instead of 300ms).
- Use the check's job name when referring to it, not numeric IDs.

Response format:
- Start with a brief **Summary** of what you're recommending
- List each check with its proposed alerts
Keep it under 200 words. Use markdown.

IMPORTANT: After the markdown, output a structured action block so the UI can apply the alerts.
Format it EXACTLY like this:

\`\`\`json:alerts
[
  {"check_id": 123, "check_name": "my check", "alerts": [
    {"name": "ProbeFailedExecutionsTooHigh", "threshold": 1, "period": "5m"},
    {"name": "HTTPRequestDurationTooHighAvg", "threshold": 300, "period": "5m"}
  ]},
  {"check_id": 456, "check_name": "dns check", "alerts": [
    {"name": "ProbeFailedExecutionsTooHigh", "threshold": 1, "period": "5m"},
    {"name": "DNSRequestDurationTooHighAvg", "threshold": 100, "period": "5m"}
  ]}
]
\`\`\`

Rules:
- Use EXACT alert type names from the list above.
- threshold is a number (ms for duration, days for TLS, count for failed executions).
- period is a string like "5m", "10m", "15m". Omit for TLS alerts.
- Include ALL checks from the prompt, each with appropriate alerts for its type.

Full insights data:
${JSON.stringify(data, null, 0)}`;
}
