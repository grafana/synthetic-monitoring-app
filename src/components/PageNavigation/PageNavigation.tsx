import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

export const PageNavigation = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.navigationRow}>
      <div className={styles.stack}>
        <LinkButton variant="secondary" fill="outline" href={getRoute(AppRoutes.Home)}>
          Home
        </LinkButton>
        <LinkButton variant="secondary" fill="outline" href={getRoute(AppRoutes.Checks)}>
          Checks
        </LinkButton>
        <LinkButton variant="secondary" fill="outline" href={getRoute(AppRoutes.Probes)}>
          Probes
        </LinkButton>
        <LinkButton variant="secondary" fill="outline" href={getRoute(AppRoutes.Config)}>
          Config
        </LinkButton>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  navigationRow: css({
    display: `flex`,
    justifyContent: `flex-start`,
    alignItems: `center`,
    marginBottom: theme.spacing(2),
  }),
  stack: css({
    alignItems: `center`,
    display: `flex`,
    gap: theme.spacing(2),
  }),
});



