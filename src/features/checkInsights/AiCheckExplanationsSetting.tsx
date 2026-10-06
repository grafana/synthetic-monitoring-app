import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAssistant, useLimits, useTerms } from '@grafana/assistant';
import { Button, ConfirmModal, Field, Stack, Switch, Text } from '@grafana/ui';
import { setAiCheckExplanationsEnabled } from 'features/checkInsights/setAiCheckExplanationsEnabled';

import { getUserPermissions } from 'data/permissions';
import { useMeta } from 'hooks/useMeta';

const OPEN_ASSISTANT_ORIGIN = 'grafana-synthetic-monitoring-app/ai-check-explanations-setting';

// Settings-page control for the org-level AI check explanation feature (see
// features/checkInsights/useCheckFailureExplanation.ts). On by default wherever Grafana
// Assistant is already enabled (unset -> true) — an org that doesn't want every failing check
// dashboard calling Assistant has to say so once, here.
export function AiCheckExplanationsSetting() {
  const meta = useMeta();
  const { canWriteSM } = getUserPermissions();
  const { isAvailable: isAssistantAvailable, isLoading: isAssistantLoading, openAssistant } = useAssistant();
  const { accepted: termsAccepted, loading: termsLoading, error: termsError } = useTerms();
  const { isLimitReached, loading: limitsLoading, error: limitsError } = useLimits();
  const [pendingEnable, setPendingEnable] = useState(false);

  const isEnabled = meta.jsonData.aiCheckExplanationsEnabled ?? true;
  const isStatusLoading = isAssistantLoading || termsLoading || limitsLoading;
  // A failed terms/limits check isn't "not accepted" or "limit reached", it's "we don't know" -
  // keep the toggle disabled either way, but say so distinctly below instead of telling someone
  // to accept terms or that they're capped when the real problem is the status check itself.
  const hasAssistantStatusError = Boolean(termsError || limitsError);
  const isAssistantReady = isAssistantAvailable && termsAccepted && !isLimitReached && !hasAssistantStatusError;
  // Turning it off is always safe and should always be available to anyone with write access —
  // only turning it *on* needs Assistant to actually be usable. Gating both the same way would
  // mean an org that's missing terms, over its limit, or without Assistant at the time this
  // defaults to on could never opt out, and the setting would silently start working the moment
  // Assistant became ready, with no one having chosen that.
  const canToggle = canWriteSM && (isEnabled || isAssistantReady);

  const mutation = useMutation({
    mutationFn: (nextValue: boolean) => setAiCheckExplanationsEnabled(meta, nextValue),
  });

  const handleChange = (nextValue: boolean) => {
    if (nextValue) {
      setPendingEnable(true);
      return;
    }

    mutation.mutate(false);
  };

  // Only reports problems now — the org-wide/usage-cost framing is a permanent part of the
  // Field description below instead of a caption that only appeared once Assistant happened to
  // already be ready, which meant it was easy to never actually see.
  // Same wording as grafana-k6-app's own "Generate test" button (NewTestPromptForm.tsx:
  // createButtonTooltip) for the first two — terms get a dedicated row below instead, since
  // accepting them takes an action (opening Assistant), not just an explanation.
  const statusCaption = !isAssistantAvailable
    ? 'Requires Grafana Assistant to be enabled for this organization.'
    : hasAssistantStatusError
      ? "Couldn't check Grafana Assistant's status. Try again shortly."
      : isLimitReached
        ? "Grafana Assistant's usage limit has been reached."
        : undefined;

  return (
    <>
      <Field disabled={!canToggle || mutation.isPending}>
        {/* Field's `description` prop only renders alongside a string `label` — we don't have
            one here, so this text has to be a direct child instead, or it silently vanishes. */}
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" color="secondary">
            {"Ask Grafana Assistant for a one-sentence explanation whenever a failing check's dashboard is opened. " +
              "Applies org-wide, and counts against your organization's Grafana Assistant usage."}
          </Text>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Switch
              value={isEnabled}
              disabled={!canToggle || mutation.isPending}
              onChange={(e) => handleChange(e.currentTarget.checked)}
            />
            {!isStatusLoading && statusCaption && (
              <Text variant="bodySmall" color="secondary">
                {statusCaption}
              </Text>
            )}
          </Stack>
        </Stack>
      </Field>
      {!isStatusLoading && isAssistantAvailable && !hasAssistantStatusError && !isLimitReached && !termsAccepted && (
        <Stack alignItems="center" gap={1}>
          <Text variant="bodySmall" color="secondary">
            Write a message in Assistant to accept the Grafana Assistant terms and conditions.
          </Text>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openAssistant?.({ origin: OPEN_ASSISTANT_ORIGIN })}
          >
            Open assistant
          </Button>
        </Stack>
      )}
      <ConfirmModal
        isOpen={pendingEnable}
        title="Enable AI check failure explanations?"
        body="You can turn this off again at any time."
        confirmText="Enable"
        confirmVariant="primary"
        onConfirm={() => {
          setPendingEnable(false);
          mutation.mutate(true);
        }}
        onDismiss={() => setPendingEnable(false)}
      />
    </>
  );
}
