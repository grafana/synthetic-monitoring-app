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
  const { accepted: termsAccepted, loading: termsLoading } = useTerms();
  const { isLimitReached, loading: limitsLoading } = useLimits();
  const [pendingEnable, setPendingEnable] = useState(false);

  const isEnabled = meta.jsonData.aiCheckExplanationsEnabled ?? true;
  const isStatusLoading = isAssistantLoading || termsLoading || limitsLoading;
  const isAssistantReady = isAssistantAvailable && termsAccepted && !isLimitReached;
  const canToggle = canWriteSM && isAssistantReady;

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

  // Same three reasons, same wording, as grafana-k6-app's own "Generate test" button
  // (NewTestPromptForm.tsx: createButtonTooltip) — terms get a dedicated row below instead,
  // since accepting them takes an action (opening Assistant), not just an explanation.
  const statusCaption = isAssistantReady
    ? "May count against your organization's Grafana Assistant usage."
    : !isAssistantAvailable
      ? 'Requires Grafana Assistant to be enabled for this organization.'
      : isLimitReached
        ? "Grafana Assistant's usage limit has been reached."
        : undefined;

  return (
    <>
      <Field
        description="Ask Grafana Assistant for a one-sentence explanation whenever a failing check's dashboard is opened. Applies org-wide."
        disabled={!canToggle || mutation.isPending}
      >
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
      </Field>
      {!isStatusLoading && isAssistantAvailable && !isLimitReached && !termsAccepted && (
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
        body="Every time a failing check's dashboard is opened, across everyone in this org, Grafana will ask Assistant to generate an explanation. This counts against your organization's Grafana Assistant usage."
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
