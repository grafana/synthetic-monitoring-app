import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { VerifiedMeta } from 'contexts/MetaContext';
import { BackendAddress } from 'components/BackendAddress';
import { ConfigActions } from 'components/ConfigActions';
import { LinkedDatasourceView } from 'components/LinkedDatasourceView';
import { ProgrammaticManagement } from 'components/ProgrammaticManagement';

import { ConfigContent } from '../ConfigContent';

export function GeneralTab({ initialized, meta }: { initialized?: boolean; meta: VerifiedMeta }) {
  const styles = useStyles2(getStyles);

  return (
    <ConfigContent title="General">
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
              <h5>Linked Data Sources</h5>
              <div className={styles.linkedDatasourceItems}>
                <LinkedDatasourceView type="prometheus" />
                <LinkedDatasourceView type="loki" />
              </div>
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
    </ConfigContent>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    tenantConfig: css({
      marginTop: theme.spacing(4),
    }),
    paddingX: css({
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4),
    }),
    linkedDatasources: css({
      marginTop: theme.spacing(4),
    }),
    linkedDatasourceItems: css({
      display: 'flex',
      // padding: theme.spacing(1),
      gap: theme.spacing(1),
      borderRadius: theme.shape.radius.default,
      flexDirection: 'column',
      // background: theme.colors.background.primary,
      '& > *': {
        padding: theme.spacing(2),
        borderRadius: theme.shape.radius.default,
        background: theme.colors.background.primary,
      },
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
