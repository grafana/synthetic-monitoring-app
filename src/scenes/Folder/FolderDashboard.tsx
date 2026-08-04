import React, { useEffect, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Badge, EmptyState, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackFolderDashboardViewed } from 'features/tracking/folderEvents';

import { Check } from 'types';
import { getCheckRuntimeAlertState, useChecksAlertStates } from 'data/useCheckAlertStates';
import { useDemAssistantContext } from 'hooks/useDemAssistantContext';
import { Feedback } from 'components/Feedback';

import { FolderCheckTable } from './FolderCheckTable';
import { useFolderCheckMetrics } from './FolderDashboard.hooks';
import { FolderKPIs } from './FolderKPIs';
import { FolderRecentFailures } from './FolderRecentFailures';
import { FolderSwimlane } from './FolderSwimlane';
import { useFolderExecutionLogs } from './FolderSwimlane.hooks';

interface FolderDashboardProps {
  folderTitle: string;
  checks: Check[];
}

/**
 * Opinionated folder overview: a fixed, auto-refreshing last-3h window across
 * every section. No time picker or filters by design (v1) — per-check
 * dashboards carry those controls.
 */
export const FolderDashboard = ({ folderTitle, checks }: FolderDashboardProps) => {
  const styles = useStyles2(getStyles);
  const metrics = useFolderCheckMetrics(checks);
  const { data: alertStates } = useChecksAlertStates(checks);
  const executionLogs = useFolderExecutionLogs(checks);

  useDemAssistantContext(checks);

  useEffect(() => {
    trackFolderDashboardViewed({ checkCount: checks.length });
    // Fire once per page view, not on data refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A check needs attention when it is currently down or has a firing alert.
  const attentionCount = useMemo(() => {
    return checks.filter((check) => {
      const isDown = metrics.getSummary(check).isUp === false;
      const isFiring = alertStates ? getCheckRuntimeAlertState(alertStates, check).firingCount > 0 : false;
      return isDown || isFiring;
    }).length;
  }, [checks, metrics, alertStates]);

  if (checks.length === 0) {
    return (
      <PluginPage pageNav={{ text: folderTitle }}>
        <EmptyState variant="not-found" message="This folder doesn't have any checks yet" />
      </PluginPage>
    );
  }

  return (
    <PluginPage
      pageNav={{ text: folderTitle }}
      actions={<Feedback feature="folder-dashboard" about={{ text: 'New feature!' }} />}
      renderTitle={() => (
        <Stack alignItems="center" gap={1}>
          <h1 className={styles.title}>{folderTitle}</h1>
          {attentionCount > 0 && (
            <Badge
              text={`${attentionCount} need${attentionCount === 1 ? 's' : ''} attention`}
              color="red"
              icon="exclamation-triangle"
            />
          )}
        </Stack>
      )}
    >
      <Stack direction="column" gap={1}>
        <FolderKPIs checks={checks} metrics={metrics} executionLogs={executionLogs} />

        <FolderSwimlane checks={checks} executionLogs={executionLogs} />

        <FolderCheckTable checks={checks} metrics={metrics} alertStates={alertStates} />

        <FolderRecentFailures checks={checks} executionLogs={executionLogs} />
      </Stack>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  title: css({
    margin: 0,
  }),
});
