import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { EmptyState, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { getUserPermissions } from 'data/permissions';
import { AddNewCheckButton } from 'components/AddNewCheckButton';
import { CloudSetupCliPanel } from 'components/CloudSetupCliPanel';

interface ChecksEmptyStatePageProps {
  className?: string;
}

export function ChecksEmptyState({ className }: ChecksEmptyStatePageProps) {
  const styles = useStyles2(getStyles);
  const { canWriteChecks } = getUserPermissions();

  return (
    <div className={className} data-testid={CHECKS_TEST_ID.emptyState}>
      <div className={styles.compactEmptyState}>
        <EmptyState variant="call-to-action" message="You haven't created any checks yet" button={
          <div className={styles.cliSection}>
            <AddNewCheckButton source="check-list-empty-state">Create your first check</AddNewCheckButton>

            {canWriteChecks && (
              <>
                <div className={styles.panelIntro}>
                  <Text variant="bodySmall" color="secondary" element="p">
                    Or run our setup wizard in your project folder:
                  </Text>
                </div>

                <CloudSetupCliPanel />
              </>
            )}
          </div>
        }>
          Get started monitoring your services with Grafana Cloud
        </EmptyState>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    // Wraps EmptyState's own message/subtitle, so their size can be bumped below.
    compactEmptyState: css({
      '& > div > div': {
        gap: theme.spacing(2),
        maxWidth: '760px',
        // Text always overwrites className, so bump title/subtitle size via this selector instead.
        '& > div > span:nth-of-type(1)': {
          fontSize: `calc(${theme.typography.h4.fontSize} * 1.1)`,
        },
        '& > div > span:nth-of-type(2)': {
          fontSize: `calc(${theme.typography.body.fontSize} * 1.1)`,
        },
      },
    }),
    cliSection: css({
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
    }),
    panelIntro: css({
      marginTop: theme.spacing(2),
    }),
  };
}
