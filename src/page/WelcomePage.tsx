import React, { FC, useContext } from 'react';
import { GrafanaTheme2, OrgRole, PageLayoutType } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { PluginPage } from 'components/PluginPage';
import { WelcomeTabs } from 'components/WelcomeTabs/WelcomeTabs';
import { AppInitializer } from './AppInitializer';

interface Props {}

export const WelcomePage: FC<Props> = () => {
  const styles = useStyles2(getStyles);
  const { meta } = useContext(InstanceContext);

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <div className={styles.container}>
        <div className={styles.header}>
          <img src={meta?.info.logos.large} className={styles.logo} role="presentation" />
          <h1 className={styles.title}>
            Proactively monitor your endpoints and user flows from locations around the world
          </h1>
          <div>
            <h5 className={styles.description}>
              Grafana Cloud Synthetic Monitoring is powered by k6, Mimir, and Loki. Measure performance and uptime,
              simulate user journeys, and get alerted before your users
            </h5>
          </div>
          <AppInitializer
            disabled={!hasRole(OrgRole.Editor)}
            buttonText="Get started"
            buttonClassname={styles.getStartedButton}
          />
        </div>
        <hr className={styles.divider} />
        <div className={styles.valueProp}>
          <h3 className={styles.valuePropHeader}>Up and running in seconds, no instrumentation required</h3>
          <WelcomeTabs />
        </div>
      </div>
    </PluginPage>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      width: '100%',
      height: '100%',
      marginTop: theme.spacing(16),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      textAlign: 'center',
    }),
    header: css({
      maxWidth: '660px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginBottom: theme.spacing(8),
    }),
    logo: css({
      width: '100px',
    }),
    title: css({
      paddingTop: theme.spacing(8),
      paddingBottom: theme.spacing(4),
    }),
    errorAlert: css({
      marginTop: theme.spacing(4),
    }),
    description: css({
      color: theme.colors.text.secondary,
    }),
    getStartedButton: css({
      marginTop: theme.spacing(4),
    }),
    divider: css({
      width: '100%',
    }),
    valueProp: css({
      marginTop: theme.spacing(6),
      maxWidth: '860px',
      width: '100%',
    }),
    valuePropHeader: css({ marginBottom: theme.spacing(4) }),
  };
}
