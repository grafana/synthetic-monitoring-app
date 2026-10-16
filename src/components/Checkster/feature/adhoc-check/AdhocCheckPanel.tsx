import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, EmptyState, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { useCanReadLogs } from 'hooks/useDSPermission';

import { FaroUserAction } from '../../../../faro';
import { trackFaroUserAction } from '../../../../features/tracking/userAction';
import { CenteredSpinner } from '../../../CenteredSpinner';
import { Column } from '../../components/ui/Column';
import { AdhocResultsList } from './AdhocResultsList';
import { INSUFFICIENT_LOG_ACCESS_MESSAGE } from './constants';
import { useAdHocResults } from './useAdHocResults';
import { useOnBeforeAdhocCheck } from './useOnBeforeAdhocCheck';

export function AdhocCheckPanel() {
  const canReadLogs = useCanReadLogs();
  const styles = useStyles2(getStyles);
  const { doAdhocCheck, data: newHocCheckRequest } = useOnBeforeAdhocCheck();
  const { items, hasPendingChecks, isLoadingProbes } = useAdHocResults(newHocCheckRequest);

  const handleAdHocCheck = () => {
    trackFaroUserAction(FaroUserAction.AdhocCheckTestClicked);
    doAdhocCheck();
  };

  if (isLoadingProbes) {
    return <CenteredSpinner />;
  }

  if (!items.length) {
    return (
      <div className={styles.root}>
        <EmptyState
          message="You can test your check to see how it behaves in the wild"
          variant="completed"
          button={
            <Button
              data-testid={CHECKSTER_TEST_ID.feature.adhocCheck.TestButton.root}
              disabled={!canReadLogs}
              aria-disabled={!canReadLogs}
              data-disabled={!canReadLogs}
              tooltip={!canReadLogs ? INSUFFICIENT_LOG_ACCESS_MESSAGE : undefined}
              variant="secondary"
              type="button"
              onClick={handleAdHocCheck}
            >
              Test
            </Button>
          }
        >
          {canReadLogs ? 'Before you save your check, test how it will behave.' : `${INSUFFICIENT_LOG_ACCESS_MESSAGE}.`}
        </EmptyState>
      </div>
    );
  }

  return (
    <Column gap={2} className={styles.root}>
      <div>
        <Button
          data-testid={CHECKSTER_TEST_ID.feature.adhocCheck.TestButton.root}
          disabled={!canReadLogs || hasPendingChecks}
          tooltip={
            hasPendingChecks
              ? `You'll have to wait for pending checks to complete/timeout before you can trigger a new test`
              : undefined
          }
          variant="secondary"
          type="button"
          onClick={handleAdHocCheck}
        >
          Test
        </Button>
      </div>

      <AdhocResultsList items={items} />
    </Column>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    root: css`
      padding: ${theme.spacing(1, 1, 1, 0)};
    `,
  };
}
