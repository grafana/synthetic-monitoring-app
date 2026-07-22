import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckDashboardHeaderProfile } from './CheckDashboardHeader.types';
import { Check } from 'types';

import { CheckDefinitionSummary } from './CheckDefinitionSummary';
import { CheckIdentitySummary } from './CheckIdentitySummary';
import { DashboardScopeControls } from './DashboardScopeControls';
import { ObservedPerformanceSummary } from './ObservedPerformanceSummary';

export function CheckDashboardLayout<TCheck extends Check>({
  check,
  profile,
  actions,
  children,
}: PropsWithChildren<{
  check: TCheck;
  profile: CheckDashboardHeaderProfile<TCheck>;
  actions?: ReactNode;
}>) {
  const styles = useStyles2(getStyles);
  const definition = profile.getDefinition(check);

  return (
    <div className={styles.container} data-testid="check-dashboard-layout">
      <CheckIdentitySummary actions={actions} model={definition} />
      <ObservedPerformanceSummary check={check} profile={profile} />
      <CheckDefinitionSummary model={definition} />
      <div className={styles.scopeRow} data-testid="dashboard-scope-sticky">
        <DashboardScopeControls />
      </div>
      {children}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  scopeRow: css({
    background: theme.colors.background.primary,
    borderTop: `1px solid ${theme.colors.border.weak}`,
    paddingTop: theme.spacing(1),
    position: 'sticky',
    top: theme.spacing(6),
    zIndex: theme.zIndex.navbarFixed,
  }),
});
