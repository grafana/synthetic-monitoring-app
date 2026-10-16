import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LoadingPlaceholder, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AdHocCheckState } from 'components/Checkster/feature/adhoc-check/types.adhoc-check';

import { AdhocFailureEvidence, getAdhocFailureEvidence } from './adhocFailureEvidence';
import { ExplainedCheck, useAdhocFailureExplanation } from './useAdhocFailureExplanation';

interface AdhocFailureExplanationProps {
  run: AdHocCheckState;
  check: ExplainedCheck;
}

/** Says why a test run failed, with the log lines the explanation is based on. Silent while pending or when it passed. */
export function AdhocFailureExplanation({ run, check }: AdhocFailureExplanationProps) {
  const evidence = getAdhocFailureEvidence(run);
  // Split so the Assistant hooks only mount once there is a failure to explain.
  return evidence ? <FailureSummary runId={run.id} check={check} evidence={evidence} /> : null;
}

function FailureSummary({
  runId,
  check,
  evidence,
}: {
  runId: string;
  check: ExplainedCheck;
  evidence: AdhocFailureEvidence;
}) {
  const styles = useStyles2(getStyles);
  const { explanation, isLoading, unavailableReason } = useAdhocFailureExplanation(runId, check, evidence);
  const { failingProbes, lines } = evidence;

  return (
    <div className={styles.card} role="status" aria-label="Test failure summary">
      <Stack gap={1} alignItems="flex-start">
        <Icon name="exclamation-triangle" className={styles.icon} />
        <Stack direction="column" gap={0.5}>
          <Text weight="medium">The test failed</Text>
          {isLoading ? (
            <LoadingPlaceholder text="Working out why…" />
          ) : explanation ? (
            <Text>{explanation}</Text>
          ) : unavailableReason ? (
            <Text variant="bodySmall" color="secondary">
              {unavailableReason}
            </Text>
          ) : null}
          <Text variant="bodySmall" color="secondary">
            Failing from: {failingProbes.join(', ')}
          </Text>
          {lines.length > 0 && (
            <ul className={styles.lines}>
              {lines.map((line) => (
                <li key={line.text}>
                  <Text variant="bodySmall" color={line.severity === 'critical' ? 'error' : 'secondary'}>
                    {line.text}
                  </Text>
                </li>
              ))}
            </ul>
          )}
        </Stack>
      </Stack>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    card: css({
      padding: theme.spacing(1.5, 2),
      border: `1px solid ${theme.colors.error.border}`,
      borderRadius: theme.shape.radius.default,
      background: theme.colors.error.transparent,
    }),
    icon: css({ color: theme.colors.error.text, marginTop: theme.spacing(0.25) }),
    lines: css({ margin: 0, paddingLeft: theme.spacing(2) }),
  };
}
