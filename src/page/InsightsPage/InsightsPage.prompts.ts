import type { InsightsCheckMeta, InsightsResponse } from 'datasource/responses.types';

// -- Origins (used to track where assistant interactions come from) --

export const ORIGINS = {
  investigate: 'grafana/synthetic-monitoring/insights/investigate',
  overlapping: 'grafana/synthetic-monitoring/insights/overlapping',
  duplicates: 'grafana/synthetic-monitoring/insights/duplicates',
  usage: 'grafana/synthetic-monitoring/insights/usage',
  performance: 'grafana/synthetic-monitoring/insights/performance',
  recommendations: 'grafana/synthetic-monitoring/insights/recommendations',
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

CRITICAL DATA INTERPRETATION RULES:
- All rate values (success_rate, mean_success_rate) are 0-1 decimals. Convert to percentages rounded to 1 decimal (e.g. 0.5536 = 55.4%). Never show raw floats.
- \`success_rate\` in uptime_warnings is the check's execution-level success ratio (called "Reachability" in the dashboard). This is NOT the same as the dashboard "Uptime" which uses max_over_time and is more lenient.
- \`mean_success_rate\` in regional_anomalies is the average across ALL probes (including healthy ones). The \`anomalous_probes\` are the ones performing significantly worse than this mean. The API does not provide per-probe rates, so do NOT state specific percentages for individual probes. Instead say the anomalous probe is "underperforming relative to the fleet average of X%".
- \`state_changes\` is the total number of up/down transitions in the observation window.
- \`degradation_pct\` is already a percentage (e.g. 611 means +611%).
When referring to checks, use their job name.
If you need exact per-probe metrics that the insights data doesn't provide (e.g. individual probe success rates for regional anomalies, or per-probe latency), use the available tool to query Prometheus rather than guessing.

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
