import { useQuery } from '@tanstack/react-query';
import { llm } from '@grafana/llm';
import { type FailureLogLine, fetchRecentFailureLogLines } from 'features/checkInsights/fetchRecentFailureLogLines';
import { useLlmEnabled } from 'features/checkInsights/useLlmEnabled';

import { Check } from 'types';
import { getCheckType } from 'utils';
import { getCheckRuntimeAlertState, useChecksAlertStates } from 'data/useCheckAlertStates';
import { useCheckReachabilitySuccessRate } from 'data/useSuccessRates';
import { getStartEnd } from 'data/utils';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMeta } from 'hooks/useMeta';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

// Matches the yellow/red boundary already used by the Reachability/Uptime stat panels:
// below this, or with anything firing, the check counts as failing for explanation purposes.
const FAILING_REACHABILITY_THRESHOLD = 0.99;

function buildPrompt(
  check: Check,
  reachabilityFraction: number | undefined,
  firingAlertNames: Set<string>,
  recentFailureLogLines: FailureLogLine[]
): string {
  const checkType = getCheckType(check.settings);
  const reachabilityText =
    reachabilityFraction === undefined
      ? 'no recent reachability data is available'
      : `reachability over the last 3 hours is ${(reachabilityFraction * 100).toFixed(1)}%`;
  const alertsText =
    firingAlertNames.size > 0
      ? `the following alert(s) are firing: ${Array.from(firingAlertNames).join(', ')}`
      : 'no alerts are currently firing';
  const enabledText = check.enabled
    ? ''
    : ` The check is disabled${check.disableReason ? ` (reason: ${check.disableReason})` : ''}.`;
  // These are the actual trigger for the failure (timeouts, TLS errors, assertion failures, ...)
  // — feeding them in is what lets the model explain the real cause instead of just restating
  // the aggregate reachability number back as prose, or guessing based on the check type alone.
  // Labeling each line's severity nudges the model toward the "root cause" lines rather than
  // just restating a "consequence" (e.g. a downstream assertion failure) as if it were the cause.
  const logsText =
    recentFailureLogLines.length > 0
      ? `Recent failure reasons from execution logs, most recent first:\n${recentFailureLogLines
          .map((line) => `- [${line.severity === 'critical' ? 'root cause' : 'consequence'}] ${line.text}`)
          .join('\n')}`
      : 'No recent failure reasons were found in the execution logs for this check.';

  return (
    `A Grafana Synthetic Monitoring ${checkType} check named "${check.job}" targeting "${check.target}" ` +
    `is showing problems: ${reachabilityText}, and ${alertsText}.${enabledText}\n\n${logsText}\n\n` +
    `Using the failure reasons as the primary evidence, explain in one short, plain-English sentence the ` +
    `most likely root cause of this failure. Only state a specific cause (e.g. a TLS/certificate error, a ` +
    `DNS failure, a specific script step) if it is directly supported by the evidence above — do not guess ` +
    `a plausible-sounding cause the check type commonly has if the evidence doesn't back it up. If the ` +
    `evidence is too thin or generic to point to a specific cause, say that plainly instead. Start the ` +
    `sentence with the specific fact itself — no "the check failed because" or "the script encountered ` +
    `an error due to" lead-in at all. Say what happened, not that something happened.`
  );
}

export function useCheckFailureExplanation(check: Check) {
  const meta = useMeta();
  // Defaults to on (unset -> true): orgs with the LLM app configured get this immediately, no
  // explicit opt-in required. An org that wants it off has to say so once; see AiCheckExplanationsSetting.
  const aiCheckExplanationsEnabled = meta.jsonData.aiCheckExplanationsEnabled ?? true;

  const reachabilityQuery = useCheckReachabilitySuccessRate(check);
  const alertStatesQuery = useChecksAlertStates([check]);
  const logsUrl = useLogsDS()?.url || '';

  const reachabilityFraction = reachabilityQuery.data ? Number(reachabilityQuery.data.value[1]) : undefined;
  const { firingCount, firingAlertNames } = getCheckRuntimeAlertState(alertStatesQuery.data ?? {}, check);
  const isCheckFailing =
    firingCount > 0 || (reachabilityFraction !== undefined && reachabilityFraction < FAILING_REACHABILITY_THRESHOLD);
  // Whether it's worth attempting an AI explanation at all: the check has to actually be
  // failing, and the org has to have opted in. `isCheckFailing` above stays a plain factual
  // read so callers can still show a status (e.g. a healthy/green state) when this is false.
  const showAiExplanation = isCheckFailing && aiCheckExplanationsEnabled;

  // Only pay for the LLM app health-check once there's actually a reason to show something —
  // no need to ask on every healthy check's dashboard, or when the org hasn't opted in at all.
  const llmEnabledQuery = useLlmEnabled(showAiExplanation);
  const llmEnabled = llmEnabledQuery.data;

  const explanationQuery = useQuery({
    // The primitives below are a full, stable decomposition of check/reachabilityFraction/firingAlertNames
    // (which don't compare well by identity across renders), so they're deliberately used as the key instead.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      'check_failure_explanation',
      check.job,
      check.target,
      check.enabled,
      check.disableReason,
      reachabilityFraction === undefined ? null : Math.round(reachabilityFraction * 1000),
      Array.from(firingAlertNames).sort().join(','),
    ],
    queryFn: async () => {
      const enabled = await llm.enabled();
      if (!enabled) {
        return null;
      }

      const { start, end } = getStartEnd();
      const recentFailureLogLines = await fetchRecentFailureLogLines(logsUrl, check, start, end);

      const response = await llm.chatCompletions({
        model: llm.Model.BASE,
        temperature: 0.2,
        max_tokens: 100,
        messages: [
          {
            role: 'system',
            content:
              'You are an SRE assistant explaining synthetic monitoring check failures, grounded strictly in the evidence given (execution log failure reasons and firing alerts), not in assumptions about what commonly goes wrong with this kind of check. Never state a specific cause the evidence doesn\'t support. Reply with exactly one short, plain-English sentence and nothing else — no preamble, no markdown.',
          },
          { role: 'user', content: buildPrompt(check, reachabilityFraction, firingAlertNames, recentFailureLogLines) },
        ],
      });

      const explanation = response.choices[0]?.message.content?.trim();
      if (!explanation) {
        return null;
      }

      // Kept alongside the explanation (rather than re-derived by the caller) so the UI can show
      // exactly the evidence the model saw, not a live/possibly-since-changed version of it.
      return { explanation, recentFailureLogLines };
    },
    enabled: showAiExplanation && Boolean(llmEnabled),
    staleTime: STANDARD_REFRESH_INTERVAL,
    retry: false,
  });

  // Covers the whole investigation, not just the chat completion call: the moment the check is
  // confirmed failing we're already "investigating" from the user's perspective, so this stays
  // true through the LLM health-check too, not just once the actual explanation request starts.
  const isLoading =
    showAiExplanation && (llmEnabledQuery.isLoading || (Boolean(llmEnabled) && explanationQuery.isLoading));

  return {
    isCheckFailing,
    showAiExplanation,
    explanation: explanationQuery.data?.explanation,
    isLoading,
    isError: explanationQuery.isError,
    facts: {
      reachabilityFraction,
      firingAlertNames,
      recentFailureLogLines: explanationQuery.data?.recentFailureLogLines ?? [],
    },
  };
}
