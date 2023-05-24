import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Container, Spinner, useStyles2 } from '@grafana/ui';
import { ConfigActions } from 'components/ConfigActions';
import { DashboardList } from 'components/DashboardList';
import { ProgrammaticManagement } from 'components/ProgrammaticManagement';
import LinkedDatasourceView from 'components/LinkedDatasourceView';
import { InstanceContext } from 'contexts/InstanceContext';
import React, { useContext } from 'react';

function getStyles(theme: GrafanaTheme2) {
  return {
    tenantConfig: css`
      padding-top: ${theme.spacing(4)};
      margin-top: ${theme.spacing(4)};
      background: ${theme.colors.background.primary};
    `,
    paddingX: css`
      padding-left: ${theme.spacing(4)};
      padding-right: ${theme.spacing(4)};
    `,
    linkedDatasources: css`
      margin-top: ${theme.spacing(4)};
    `,
    backendAddress: css`
      margin-top: ${theme.spacing(4)};
    `,
    programmaticManagement: css`
      padding: ${theme.spacing(2)} 0;
    `,
    configActions: css`
      padding: ${theme.spacing(4)} 0;
    `,
  };
}

export function ConfigPage() {
  const { meta, loading, instance } = useContext(InstanceContext);

  const styles = useStyles2(getStyles);

  if (loading) {
    return <Spinner />;
  }
  return (
    <div>
      <div>
        <div>
          <h4>Synthetic Monitoring App</h4>
        </div>
        <p>
          Synthetic Monitoring is a blackbox monitoring solution provided as part of{' '}
          <a
            className="highlight-word"
            href="https://grafana.com/products/cloud/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Grafana Cloud
          </a>
          . If you don&apos;t already have a Grafana Cloud service,{' '}
          <a
            className="highlight-word"
            href="https://grafana.com/signup/cloud"
            target="_blank"
            rel="noopener noreferrer"
          >
            sign up now{' '}
          </a>
        </p>
      </div>
      {instance.api && (
        <div className={styles.tenantConfig}>
          <DashboardList
            options={instance.api.instanceSettings.jsonData}
            checkUpdates={true}
            onChange={instance.api.onOptionsChange}
          />
          <div className={styles.linkedDatasources}>
            <h3>Linked Data Sources</h3>
            <Container margin="sm">
              <LinkedDatasourceView type="prometheus" />
              <LinkedDatasourceView type="loki" />
            </Container>
          </div>
          <div className={styles.backendAddress}>
            <h3>Backend address</h3>
            <pre>{instance.api.instanceSettings.jsonData.apiHost}</pre>
          </div>
        </div>
      )}
      <div className={styles.programmaticManagement}>{meta?.enabled && <ProgrammaticManagement />}</div>
      <div className={styles.configActions}>
        <hr></hr>
        <ConfigActions enabled={meta?.enabled} pluginId={meta?.id ?? 'grafana-synthetic-monitoring-app'} />
      </div>
      <div>Plugin version: {meta?.info.version}</div>
    </div>
  );
}
