import React from 'react';
import { PluginPage } from 'components/PluginPage';
import { Alert, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    max-width: 1000px;
  `,
  link: css`
    text-decoration: underline;
  `,
});

export const UnprovisionedSetup = () => {
  const styles = useStyles2(getStyles);

  return (
    <PluginPage pageNav={{ text: 'Invalid provisioning' }}>
      <div className={styles.container}>
        <Alert title="Provisioning missing or invalid" severity="error">
          Provisioning is required for Synthetic Monitoring.
        </Alert>
        <p>
          It looks like your Grafana instance hasn&apos;t been provisioned correctly to use the Synthetic Monitoring
          plugin. <strong>Remember to restart your Grafana instance after making provisiong changes.</strong>
        </p>
        <ul>
          <li>
            <a className={styles.link} href="https://grafana.com/docs/grafana/latest/administration/provisioning/">
              Learn more about what provisioning is
            </a>
          </li>
          <li>
            <a className={styles.link} href="https://github.com/grafana/synthetic-monitoring-app/#configuration">
              Learn how to provision Synthetic Monitoring
            </a>
          </li>
        </ul>
      </div>
    </PluginPage>
  );
};
