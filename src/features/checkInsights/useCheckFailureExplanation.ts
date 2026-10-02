import { useQuery } from '@tanstack/react-query';
import { useAssistant, useInlineAssistant, useLimits, useTerms } from '@grafana/assistant';
import { type FailureLogLine, fetchRecentFailureLogLines } from 'features/checkInsights/fetchRecentFailureLogLines';

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

// A non-interactive completion, not the interactive panel (see ASSISTANT_ORIGIN in
// CheckFailureExplanation.tsx for that) — distinct origin so analytics can tell them apart.
const ASSISTANT_INLINE_ORIGIN = 'grafana-synthetic-monitoring-app/check-failure-explanation/inline';

const EXPLANATION_SYSTEM_PROMPT =
  'You are an SRE assistant explaining synthetic monitoring check failures, grounded strictly in the evidence given (execution log failure reasons and firing alerts), not in assumptions about what commonly goes wrong with this kind of check. Never state a specific cause the evidence doesn\'t support. Reply with exactly one short, plain-English sentence and nothing else — no preamble, no markdown.';

function buildPrompt(
  check: Check,
  reachabilityFraction: number | undefined,
  firingAlertNames: Set<string>,
  recentFailureLogLines: FailureLogLine[],
  failingProbes: string[]
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
  // Log text can originate from whatever the monitored target sent back, so it's untrusted —
  // low-risk here since the model's reply is only ever rendered as plain text in the UI, never
  // executed or fed into a tool-using flow. (The Actions menu's "Ask assistant"/"Start
  // investigation" keep the same lines out of the freeform prompt entirely, passing them only as
  // tagged structured `data`, not instructions — see buildInvestigationContext in
  // CheckFailureExplanation.tsx.)
  const logsText =
    recentFailureLogLines.length > 0
      ? `Recent failure reasons from execution logs, most recent first:\n${recentFailureLogLines
          .map((line) => `- [${line.severity === 'critical' ? 'root cause' : 'consequence'}] ${line.text}`)
          .join('\n')}`
      : 'No recent failure reasons were found in the execution logs for this check.';
  // A separate flat fact, not tagged onto individual lines — narrows down the investigation
  // (e.g. "from Paris" suggests a regional network issue) when it names exactly one probe.
  const probesText =
    failingProbes.length === 1
      ? `Only the "${failingProbes[0]}" probe is failing; every other probe is reachable.`
      : failingProbes.length > 1
        ? `Multiple probes are failing: ${failingProbes.join(', ')}.`
        : '';

  return (
    `A Grafana Synthetic Monitoring ${checkType} check named "${check.job}" targeting "${check.target}" ` +
    `is showing problems: ${reachabilityText}, and ${alertsText}.${enabledText} ${probesText}\n\n${logsText}\n\n` +
    `Using the failure reasons as the primary evidence, explain in one short, plain-English sentence the ` +
    `most likely root cause of this failure. Only state a specific cause (e.g. a TLS/certificate error, a ` +
    `DNS failure, a specific script step) if it is directly supported by the evidence above — do not guess ` +
    `a plausible-sounding cause the check type commonly has if the evidence doesn't back it up. If the ` +
    `evidence is too thin or generic to point to a specific cause, say that plainly instead. Start the ` +
    `sentence with the specific fact itself — no "the check failed because" or "the script encountered ` +
    `an error due to" lead-in at all. Say what happened, not that something happened. Only mention a ` +
    `probe/location by name if exactly one probe is failing — don't name one when several are.`
  );
}

export function useCheckFailureExplanation(check: Check) {
  const meta = useMeta();
  // Defaults to on (unset -> true): orgs with Grafana Assistant enabled get this immediately, no
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

  // Fetched independently of the AI explanation below — evidence (reachability, alerts, logs)
  // is useful on its own and shouldn't disappear just because the org opted out of AI
  // explanations, the LLM app isn't configured, or a chat-completion call happens to fail.
  //
  // Deliberately NOT gated on `isCheckFailing`: that would make this wait for the
  // reachability/alerts round trip to resolve before even starting, adding a full sequential
  // network round trip to the critical path. Firing it eagerly, in parallel with those queries
  // from mount, means logs are usually already in by the time we know the check is failing — at
  // the cost of one wasted Loki query per view of a check that turns out to be healthy.
  const logsQuery = useQuery({
    // check.job/check.target are the stable decomposition of `check` used as the key elsewhere
    // in this file; logsUrl only changes with the configured logs datasource, not per-render.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['check_failure_log_lines', check.job, check.target],
    queryFn: () => {
      const { start, end } = getStartEnd();
      return fetchRecentFailureLogLines(logsUrl, check, start, end);
    },
    staleTime: STANDARD_REFRESH_INTERVAL,
  });
  const recentFailureLogLines = logsQuery.data?.lines ?? [];
  const failingProbes = logsQuery.data?.failingProbes ?? [];

  // Whether a non-interactive completion is actually usable right now — mirrors the gate
  // grafana-k6-app's own inline generation uses for its "Generate test" button
  // (NewTestPromptForm.tsx): Assistant has to be available, its terms accepted, and the org's
  // monthly usage limit not already hit. More orgs have Assistant enabled than have the Grafana
  // LLM app configured, so this is checked instead of `llm.enabled()`.
  const { isAvailable: isAssistantAvailable, isLoading: isAssistantLoading } = useAssistant();
  const { accepted: termsAccepted, loading: termsLoading } = useTerms();
  const { isLimitReached, loading: limitsLoading } = useLimits();
  const { generate } = useInlineAssistant();
  const isAssistantReady = isAssistantAvailable && termsAccepted && !isLimitReached;
  const isAssistantGateLoading = isAssistantLoading || termsLoading || limitsLoading;

  const explanationQuery = useQuery({
    // The primitives below are a full, stable decomposition of check/reachabilityFraction/firingAlertNames
    // (which don't compare well by identity across renders), so they're deliberately used as the key instead.
    queryKey: [
      'check_failure_explanation',
      check.job,
      check.target,
      check.enabled,
      check.disableReason,
      reachabilityFraction === undefined ? null : Math.round(reachabilityFraction * 1000),
      Array.from(firingAlertNames).sort().join(','),
      recentFailureLogLines,
      failingProbes,
    ],
    // generate() (from useInlineAssistant) never rejects — success and failure both arrive via
    // the onComplete/onError callbacks — so this always resolves rather than throwing.
    queryFn: () =>
      new Promise<string | null>((resolve) => {
        generate({
          prompt: buildPrompt(check, reachabilityFraction, firingAlertNames, recentFailureLogLines, failingProbes),
          origin: ASSISTANT_INLINE_ORIGIN,
          systemPrompt: EXPLANATION_SYSTEM_PROMPT,
          onComplete: (text) => resolve(text.trim() || null),
          onError: () => resolve(null),
        });
      }),
    // Waits for logs to finish loading (isFetched, not just !isLoading, so a still-pending first
    // fetch doesn't slip through) so the model sees the real evidence instead of an empty array.
    enabled: showAiExplanation && isAssistantReady && logsQuery.isFetched,
    staleTime: STANDARD_REFRESH_INTERVAL,
    retry: false,
  });

  // Covers the whole investigation, not just the completion call: the moment the check is
  // confirmed failing we're already "investigating" from the user's perspective, so this stays
  // true through the log fetch and the Assistant availability/terms/limits checks too, not just
  // once the actual explanation request starts.
  const isLoading =
    showAiExplanation &&
    (isAssistantGateLoading || (isAssistantReady && (logsQuery.isLoading || explanationQuery.isLoading)));

  // Rather than silently showing nothing when the org has opted in but Assistant can't actually
  // produce anything, say so — same three reasons, and same "open assistant to fix it" path
  // (via the Actions menu), that grafana-k6-app's own "Generate test" button uses
  // (NewTestPromptForm.tsx: createButtonTooltip / TermsRow). Undefined while still loading, or
  // once Assistant is ready — a ready-but-still-failed completion stays silent, same as before.
  const explanationUnavailableReason =
    showAiExplanation && !isAssistantGateLoading && !isAssistantReady
      ? !isAssistantAvailable
        ? 'Grafana Assistant is not available.'
        : isLimitReached
          ? "Grafana Assistant's usage limit has been reached."
          : "Accept Grafana Assistant's terms and conditions to see an explanation."
      : undefined;

  return {
    isCheckFailing,
    showAiExplanation,
    explanation: explanationQuery.data ?? undefined,
    explanationUnavailableReason,
    isLoading,
    facts: {
      reachabilityFraction,
      firingAlertNames,
      recentFailureLogLines,
      failingProbes,
    },
  };
}
