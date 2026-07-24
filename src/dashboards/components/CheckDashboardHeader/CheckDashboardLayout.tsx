import React, { PropsWithChildren, ReactNode, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { CheckDashboardActions } from 'dashboards/components/CheckDashboardHeader';

import { CheckDashboardHeaderProfile } from './CheckDashboardHeader.types';
import { Check } from 'types';
import { DashboardComparisonProvider } from 'contexts/DashboardComparisonProvider';
import { DashboardPanelScopeProvider } from 'contexts/DashboardPanelScopeProvider';

import { CHECK_DASHBOARD_PAGE_GUTTER } from './CheckDashboardLayout.constants';
import { useMeasuredElementHeight, useStickySentinel } from './CheckDashboardLayout.hooks';
import { CheckDefinitionSummary } from './CheckDefinitionSummary';
import { CheckIdentitySummary } from './CheckIdentitySummary';
import { DashboardPanelScopeControls, DashboardTimeControls } from './DashboardScopeControls';
import { ObservedPerformanceSummary } from './ObservedPerformanceSummary';

const STICKY_TOP_SPACING = 6;

export function CheckDashboardLayout<TCheck extends Check>({
  check,
  profile,
  filters,
  children,
}: PropsWithChildren<{
  check: TCheck;
  profile: CheckDashboardHeaderProfile<TCheck>;
  filters?: ReactNode;
}>) {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const stickyTopPx = theme.spacing.gridSize * STICKY_TOP_SPACING;
  const { sentinelRef: timeSentinelRef, isSticky: isTimeSticky } = useStickySentinel(stickyTopPx);
  const { elementRef: globalControlsRef, height: globalControlsHeight } = useMeasuredElementHeight<HTMLDivElement>();
  const panelStickyTopPx = stickyTopPx + globalControlsHeight;
  const { sentinelRef: panelSentinelRef, isSticky: isPanelSticky } = useStickySentinel(panelStickyTopPx);
  const definition = useMemo(() => profile.getDefinition(check), [check, profile]);

  return (
    <div className={styles.container} data-testid="check-dashboard-layout">
      <div className={styles.inset}>
        <CheckIdentitySummary model={definition} actions={<CheckDashboardActions check={check} />} />
      </div>
      <DashboardComparisonProvider check={check} profile={profile.Comparison}>
        <div
          aria-hidden
          className={cx(styles.stickySentinel, styles.globalStickySentinel)}
          data-testid="dashboard-time-sticky-sentinel"
          ref={timeSentinelRef}
        />
        <div
          className={cx(styles.stickyRow, styles.globalControls, isTimeSticky && styles.stickyRowStuck)}
          data-sticky={String(isTimeSticky)}
          data-testid="dashboard-time-sticky"
          ref={globalControlsRef}
          style={{ top: stickyTopPx }}
        >
          <DashboardTimeControls />
        </div>
        <ObservedPerformanceSummary check={check} profile={profile} />
      </DashboardComparisonProvider>
      <div className={styles.definition}>
        <CheckDefinitionSummary model={definition} />
      </div>
      <DashboardPanelScopeProvider>
        <div
          aria-hidden
          className={styles.stickySentinel}
          data-testid="dashboard-panel-scope-sticky-sentinel"
          ref={panelSentinelRef}
        />
        <div
          className={cx(styles.stickyRow, styles.scopeRow, isPanelSticky && styles.stickyRowStuck)}
          data-sticky={String(isPanelSticky)}
          data-testid="dashboard-panel-scope-sticky"
          style={{ top: panelStickyTopPx }}
        >
          <DashboardPanelScopeControls filters={filters} />
        </div>
        <div className={styles.content}>{children}</div>
      </DashboardPanelScopeProvider>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minWidth: 0,
    paddingTop: theme.spacing(CHECK_DASHBOARD_PAGE_GUTTER),
    width: '100%',
  }),
  inset: css({
    minWidth: 0,
    padding: theme.spacing(0, CHECK_DASHBOARD_PAGE_GUTTER),
  }),
  globalControls: css({
    minWidth: 0,
    padding: theme.spacing(1, CHECK_DASHBOARD_PAGE_GUTTER),
    zIndex: theme.zIndex.navbarFixed + 1,
  }),
  stickySentinel: css({
    height: 1,
    marginBottom: -1,
    pointerEvents: 'none',
    width: '100%',
  }),
  globalStickySentinel: css({
    height: 0,
    marginBottom: theme.spacing(-2),
  }),
  stickyRow: css({
    background: 'transparent',
    position: 'sticky',
    transition: theme.transitions.create('background-color', {
      duration: theme.transitions.duration.shortest,
    }),
    width: '100%',
    zIndex: theme.zIndex.navbarFixed,
  }),
  stickyRowStuck: css({
    background: theme.colors.background.primary,
  }),
  scopeRow: css({
    padding: theme.spacing(1, CHECK_DASHBOARD_PAGE_GUTTER),
  }),
  definition: css({
    margin: theme.spacing(0, CHECK_DASHBOARD_PAGE_GUTTER),
    minWidth: 0,
  }),
  content: css({
    borderTop: `2px solid ${theme.colors.border.weak}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minWidth: 0,
    padding: theme.spacing(2, CHECK_DASHBOARD_PAGE_GUTTER, 0),
  }),
});
