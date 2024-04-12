import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { WelcomeTab } from './WelcomeTabs';
import {
  dashboardDark,
  dashboardLight,
  k6CodeEditorDark,
  k6CodeEditorLight,
  privateProbeDark,
  privateProbeLight,
  terraformDocs,
} from 'img';

interface Props {
  activeTab: WelcomeTab;
}

export function WelcomeTabContent({ activeTab }: Props) {
  const styles = useStyles2(getStyles);
  switch (activeTab) {
    case WelcomeTab.Protocol:
      return (
        <>
          <p>Send individual requests via HTTP, DNS, TCP, PING or a traceroute</p>

          <img src={config.theme2.isDark ? dashboardDark : dashboardLight} className={styles.screenshot} />
        </>
      );
    case WelcomeTab.K6:
      return (
        <>
          <p>Use k6 scripts to monitor your services flexibly</p>

          <img src={config.theme2.isDark ? k6CodeEditorDark : k6CodeEditorLight} className={styles.screenshot} />
        </>
      );
    case WelcomeTab.PrivateProbes:
      return (
        <>
          <p>
            In addition to the locations we provide out of the box, you can set up your own probes to run inside your
            network or from a location of your choosing
          </p>
          <img src={config.theme2.isDark ? privateProbeDark : privateProbeLight} className={styles.screenshot} />
        </>
      );
    case WelcomeTab.AsCode:
      return (
        <>
          <p>
            Manage your checks as code, either via{' '}
            <a
              href="https://registry.terraform.io/providers/grafana/grafana/latest/docs/resources/synthetic_monitoring_check"
              target="_blank"
              rel="noopener noreferrer"
              className={css({ textDecoration: 'underline' })}
            >
              Terraform
            </a>{' '}
            or directly{' '}
            <a
              href="https://github.com/grafana/synthetic-monitoring-api-go-client"
              target="_blank"
              rel="noopener noreferrer"
              className={css({ textDecoration: 'underline' })}
            >
              interact with our API
            </a>
          </p>
          <img src={terraformDocs} className={styles.screenshot} />
        </>
      );
  }
}

function getStyles(theme: GrafanaTheme2) {
  return { screenshot: css({ maxWidth: '520px' }), tabContent: css({ marginTop: theme.spacing(4) }) };
}
