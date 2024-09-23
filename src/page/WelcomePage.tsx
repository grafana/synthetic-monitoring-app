import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useMeta } from 'hooks/useMeta';
import { AppInitializer } from 'components/AppInitializer';
import { PluginPage } from 'components/PluginPage';
import { WelcomeTabs } from 'components/WelcomeTabs/WelcomeTabs';

export const WelcomePage = () => {
  const styles = useStyles2(getStyles);
  const { info } = useMeta();

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <Stack gap={4} alignItems={'center'} direction={`column`}>
            <img src={info.logos.large} className={styles.logo} role="presentation" />
            <Text element="h1">Proactively monitor your endpoints and user flows from locations around the world</Text>
            <div className={styles.description}>
              Grafana Cloud Synthetic Monitoring is powered by k6, Mimir, and Loki. Measure performance and uptime,
              simulate user journeys, and get alerted before your users
            </div>
            <AppInitializer buttonText="Get started" />
          </Stack>
        </div>
        <hr className={styles.divider} />
        <div className={styles.valueProp}>
          <Stack gap={4} alignItems={'center'} direction={`column`}>
            <Text variant={`h2`} element={`h2`}>
              Up and running in seconds, no instrumentation required
            </Text>
            <WelcomeTabs />
          </Stack>
        </div>
      </div>
    </PluginPage>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      paddingTop: theme.spacing(16),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }),
    intro: css({
      maxWidth: '660px',
    }),
    logo: css({
      width: '100px',
    }),
    description: css({
      color: theme.colors.text.secondary,
    }),
    divider: css({
      width: '100%',
      margin: theme.spacing(8, 6),
    }),
    valueProp: css({
      maxWidth: '860px',
    }),
  };
}
