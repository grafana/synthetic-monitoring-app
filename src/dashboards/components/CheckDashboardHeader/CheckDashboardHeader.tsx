import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckDashboardHeaderProfile } from './CheckDashboardHeader.types';
import { Check } from 'types';

import { CheckDefinitionSummary } from './CheckDefinitionSummary';
import { DashboardScopeControls } from './DashboardScopeControls';
import { ObservedPerformanceSummary } from './ObservedPerformanceSummary';

export function CheckDashboardHeader<TCheck extends Check>({
  check,
  profile,
  actions,
}: {
  check: TCheck;
  profile: CheckDashboardHeaderProfile<TCheck>;
  actions?: ReactNode;
}) {
  const styles = useStyles2(getStyles);

  return (
    <header className={styles.container}>
      <CheckDefinitionSummary actions={actions} model={profile.getDefinition(check)} />
      <div className={styles.scopeRow}>
        <DashboardScopeControls />
      </div>
      <ObservedPerformanceSummary check={check} profile={profile} />
    </header>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(2), minWidth: 0 }),
  scopeRow: css({ borderBottom: `1px solid ${theme.colors.border.weak}`, paddingBottom: theme.spacing(2) }),
});
