import { useQuery } from '@tanstack/react-query';
import { useAssistant, useInlineAssistant, useLimits, useTerms } from '@grafana/assistant';

import { AdhocFailureEvidence } from './adhocFailureEvidence';

const ASSISTANT_ORIGIN = 'grafana-synthetic-monitoring-app/adhoc-check-failure-explanation/inline';

const SYSTEM_PROMPT =
  "You are an SRE assistant explaining why a synthetic monitoring test run failed, grounded strictly in the evidence given (execution log failure reasons), not in assumptions about what commonly goes wrong with this kind of check. Never state a specific cause the evidence doesn't support. Reply with exactly one short, plain-English sentence and nothing else, no preamble, no markdown.";

export interface ExplainedCheck {
  job: string;
  target: string;
}

function buildPrompt(check: ExplainedCheck, evidence: AdhocFailureEvidence) {
  const logsText = evidence.lines.length
    ? `Failure reasons from the execution logs, most recent first:\n${evidence.lines
        .map((line) => `- [${line.severity === 'critical' ? 'root cause' : 'consequence'}] ${line.text}`)
        .join('\n')}`
    : 'No failure reasons were found in the execution logs.';
  const probesText =
    evidence.failingProbes.length === 1
      ? `It failed on the "${evidence.failingProbes[0]}" probe.`
      : `It failed on these probes: ${evidence.failingProbes.join(', ')}.`;

  // Log text can come from whatever the monitored target sent back, so it is untrusted. The reply
  // is only ever rendered as plain text, never executed or fed into a tool-using flow.
  return (
    `A Grafana Synthetic Monitoring browser check named "${check.job}" targeting "${check.target}" was just ` +
    `tested before being saved, and the test failed. ${probesText}\\n\\n${logsText}\\n\\n` +
    `Using the failure reasons as the primary evidence, explain in one short, plain-English sentence the most ` +
    `likely root cause. Only state a specific cause if the evidence above directly supports it. If the evidence is ` +
    `too thin or generic to point to one, say that plainly. Start with the specific fact itself, with no "the ` +
    `check failed because" lead-in. Only name a probe if exactly one probe failed.`
  ).replace(/\\n/g, '\n');
}

/**
 * One-sentence explanation of a failed ad hoc run from Grafana Assistant. Each generation is a real
 * Assistant completion charged against the org's limit, so it only fires once per run, and only when
 * Assistant is available, its terms are accepted and the limit isn't reached.
 */
export function useAdhocFailureExplanation(runId: string, check: ExplainedCheck, evidence: AdhocFailureEvidence) {
  const { isAvailable, isLoading: isAssistantLoading } = useAssistant();
  const { accepted: termsAccepted, loading: termsLoading, error: termsError } = useTerms();
  const { isLimitReached, loading: limitsLoading, error: limitsError } = useLimits();
  const { generate } = useInlineAssistant();

  // A failed status check means "unknown", not "accepted" or "not capped", so don't fire on a guess.
  const hasStatusError = Boolean(termsError || limitsError);
  const isGateLoading = isAssistantLoading || termsLoading || limitsLoading;
  // Includes the loading flags: cached terms plus a not-yet-fetched limit would otherwise pass for
  // "below the limit" and spend a completion before the limit is actually known.
  const isReady = !isGateLoading && isAvailable && termsAccepted && !isLimitReached && !hasStatusError;

  const query = useQuery({
    queryKey: ['adhoc_failure_explanation', runId],
    queryFn: () =>
      new Promise<string | null>((resolve, reject) => {
        generate({
          prompt: buildPrompt(check, evidence),
          origin: ASSISTANT_ORIGIN,
          systemPrompt: SYSTEM_PROMPT,
          onComplete: (text) => resolve(text.trim() || null),
          // Reject instead of resolving null, so a real failure differs from "nothing to say".
          onError: (error) => reject(error),
        });
      }),
    enabled: isReady,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const unavailableReason = isGateLoading
    ? undefined
    : !isReady
      ? !isAvailable
        ? 'Grafana Assistant is not available.'
        : hasStatusError
          ? "Couldn't check Grafana Assistant's status. Try again shortly."
          : isLimitReached
            ? "Grafana Assistant's usage limit has been reached."
            : "Accept Grafana Assistant's terms and conditions to see an explanation."
      : query.isError
        ? "Couldn't generate an explanation right now."
        : undefined;

  return {
    explanation: query.data ?? undefined,
    isLoading: isGateLoading || (isReady && query.isLoading),
    unavailableReason,
  };
}
