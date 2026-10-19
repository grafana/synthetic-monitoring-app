import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { EmptyState, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { getUserPermissions } from 'data/permissions';
import { AddNewCheckButton } from 'components/AddNewCheckButton';
import { CloudSetupCliPanel } from 'components/CloudSetupCliPanel';
import { CodingAgentSetup } from 'components/CloudSetupCliPanel/CodingAgentSetup';

interface ChecksEmptyStatePageProps {
  className?: string;
}

export function ChecksEmptyState({ className }: ChecksEmptyStatePageProps) {
  const styles = useStyles2(getStyles);
  const { canWriteChecks } = getUserPermissions();

  return (
    <div className={className} data-testid={CHECKS_TEST_ID.emptyState}>
      <div className={styles.compactEmptyState}>
        <EmptyState
          variant="call-to-action"
          message={t('checksEmptyState.noChecks', "You haven't created any checks yet")}
          button={
            <div className={styles.actions}>
              <Stack direction="column" gap={3}>
                {canWriteChecks && <CloudSetupCliPanel />}
                <Stack direction="column" alignItems="center">
                  <AddNewCheckButton
                    source="check-list-empty-state"
                    variant="secondary"
                    icon="arrow-right"
                    iconPlacement="right"
                  >
                    <Trans i18nKey="checksEmptyState.otherWaysToCreateChecks">Other ways to create checks</Trans>
                  </AddNewCheckButton>
                </Stack>
                {canWriteChecks && <CodingAgentSetup />}
              </Stack>
            </div>
          }
        >
          {canWriteChecks ? (
            <Trans i18nKey="checksEmptyState.wizardDescription">
              Run the setup wizard in your terminal to create your first checks.
            </Trans>
          ) : (
            <Trans i18nKey="checksEmptyState.getStarted">Get started monitoring your services with Grafana Cloud</Trans>
          )}
        </EmptyState>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    compactEmptyState: css({
      paddingInline: theme.spacing(2),
      '& > div > div': {
        gap: theme.spacing(2),
        maxWidth: '760px',
        width: '100%',
      },
    }),
    actions: css({
      width: '100%',
      textAlign: 'center',
    }),
  };
}
