import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ConfirmModal, Field, Stack, Switch, Text } from '@grafana/ui';
import { setAiCheckExplanationsEnabled } from 'features/checkInsights/setAiCheckExplanationsEnabled';
import { useLlmEnabled } from 'features/checkInsights/useLlmEnabled';

import { getUserPermissions } from 'data/permissions';
import { useMeta } from 'hooks/useMeta';

// Settings-page control for the org-level AI check explanation feature (see
// features/checkInsights/useCheckFailureExplanation.ts). On by default wherever the LLM app is
// already configured (unset -> true) — an org that doesn't want every failing check dashboard
// calling the LLM app and consuming tokens against whatever provider it's configured with has
// to say so once, here.
export function AiCheckExplanationsSetting() {
  const meta = useMeta();
  const { canWriteSM } = getUserPermissions();
  const { data: llmEnabled, isLoading: isLlmStatusLoading } = useLlmEnabled();
  const [pendingEnable, setPendingEnable] = useState(false);

  const isEnabled = meta.jsonData.aiCheckExplanationsEnabled ?? true;
  const canToggle = canWriteSM && Boolean(llmEnabled);

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

  return (
    <>
      <Field
        description="Ask Grafana's LLM app for a one-sentence explanation whenever a failing check's dashboard is opened. Applies org-wide."
        disabled={!canToggle || mutation.isPending}
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Switch value={isEnabled} disabled={!canToggle || mutation.isPending} onChange={(e) => handleChange(e.currentTarget.checked)} />
          {!isLlmStatusLoading && (
            <Text variant="bodySmall" color="secondary">
              {llmEnabled
                ? 'May incur usage cost from your LLM provider.'
                : 'Requires the Grafana LLM app to be installed and configured.'}
            </Text>
          )}
        </Stack>
      </Field>
      <ConfirmModal
        isOpen={pendingEnable}
        title="Enable AI check failure explanations?"
        body="Every time a failing check's dashboard is opened, across everyone in this org, Grafana will call the LLM app to generate an explanation. This consumes tokens/cost against whatever provider the LLM app is configured with — check your provider's pricing before enabling."
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
