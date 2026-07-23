import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { CheckDashboardActions } from 'dashboards/components/CheckDashboardHeader';

import { CheckDashboardHeaderProfile } from './CheckDashboardHeader.types';
import { Check } from 'types';

import { CHECK_DASHBOARD_PAGE_GUTTER } from './CheckDashboardLayout.constants';
import { useStickySentinel } from './CheckDashboardLayout.hooks';
import { CheckDefinitionSummary } from './CheckDefinitionSummary';
import { CheckIdentitySummary } from './CheckIdentitySummary';
import { DashboardScopeControls } from './DashboardScopeControls';
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
  const { sentinelRef, isSticky } = useStickySentinel(stickyTopPx);
  const definition = profile.getDefinition(check);

  return (
    <div className={styles.container} data-testid="check-dashboard-layout">
      <div className={styles.inset}>
        <CheckIdentitySummary model={definition} actions={<CheckDashboardActions check={check} />} />
      </div>
      <div aria-hidden className={styles.stickySentinel} data-testid="dashboard-scope-sticky-sentinel" ref={sentinelRef} />
      <div
        className={cx(styles.scopeRow, isSticky && styles.scopeRowStuck)}
        data-sticky={String(isSticky)}
        data-testid="dashboard-scope-sticky"
      >
        <DashboardScopeControls filters={filters} />
      </div>
      <ObservedPerformanceSummary check={check} profile={profile} />
      <CheckDefinitionSummary model={definition} />
      <div className={styles.content}>
        {children}
      </div>
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
  stickySentinel: css({
    height: 1,
    marginBottom: -1,
    pointerEvents: 'none',
    width: '100%',
  }),
  scopeRow: css({
    background: 'transparent',
    padding: theme.spacing(1, CHECK_DASHBOARD_PAGE_GUTTER),
    position: 'sticky',
    top: theme.spacing(STICKY_TOP_SPACING),
    transition: theme.transitions.create('background-color', {
      duration: theme.transitions.duration.shortest,
    }),
    width: '100%',
    zIndex: theme.zIndex.navbarFixed,
  }),
  scopeRowStuck: css({
    background: theme.colors.background.primary,
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
