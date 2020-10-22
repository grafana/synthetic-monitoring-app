import { GrafanaTheme } from '@grafana/data';
import { useStyles } from '@grafana/ui';
import { css } from 'emotion';
import React from 'react';

function getStyles(theme: GrafanaTheme) {
  return {
    container: css`
      display: flex;
      justify-content: center;
    `,
    errorMessage: css`
      padding: 100px;
    `,
    link: css`
      text-decoration: underline;
    `,
  };
}

export const MissingDatasources = () => {
  const styles = useStyles(getStyles);
  return (
    <div className={styles.container}>
      <div className={styles.errorMessage}>
        <h2>Missing Datasources/Provisioning</h2>
        <p>
          The Synthetic Monitoring plugin must be provisioned via a yaml file located in{' '}
          <code>conf/provisioning/plugins</code> of your Grafana instance. An example provisioning file can be found{' '}
          <a className={styles.link} href="https://github.com/grafana/synthetic-monitoring-app">
            in the Synthetic Monitoring app repo
          </a>
        </p>
        <p>
          Your Grafana instance must also have datasources pointing towards a Prometheus and Loki instance in Grafana
          Cloud.{' '}
          <a className={styles.link} href="/datasources/new">
            Add datasources
          </a>
        </p>
      </div>
    </div>
  );
};
