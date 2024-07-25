import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Container, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useMeta } from 'hooks/useMeta';
import { BackendAddress } from 'components/BackendAddress';
import { ConfigActions } from 'components/ConfigActions';
import { LinkedDatasourceView } from 'components/LinkedDatasourceView';
import { PluginPage } from 'components/PluginPage';
import { ProgrammaticManagement } from 'components/ProgrammaticManagement';

export function ConfigPage({ initialized }: { initialized?: boolean }) {
  const styles = useStyles2(getStyles);
  const meta = useMeta();

  return (
    <PluginPage>
      <div>
        <div>
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
              sign up now
            </a>
            .
          </p>
        </div>
        {initialized && (
          <div className={styles.tenantConfig}>
            <div className={styles.linkedDatasources}>
              <h3>Linked Data Sources</h3>
              <Container margin="sm">
                <LinkedDatasourceView type="prometheus" />
                <LinkedDatasourceView type="loki" />
              </Container>
            </div>
            <div className={styles.backendAddress}>
              <BackendAddress omitHttp />
            </div>
          </div>
        )}
        <div className={styles.programmaticManagement}>{initialized && <ProgrammaticManagement />}</div>
        <div className={styles.configActions}>
          <hr></hr>
          <ConfigActions initialized={initialized} />
        </div>
        <div>Plugin version: {meta.info.version}</div>
      </div>
    </PluginPage>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    tenantConfig: css({
      marginTop: theme.spacing(4),
      background: theme.colors.background.primary,
    }),
    paddingX: css({
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4),
    }),
    linkedDatasources: css({
      marginTop: theme.spacing(4),
    }),
    backendAddress: css({
      marginTop: theme.spacing(4),
    }),
    programmaticManagement: css({
      padding: theme.spacing(2, 0),
    }),
    configActions: css({
      paddingBottom: theme.spacing(2),
    }),
  };
}
