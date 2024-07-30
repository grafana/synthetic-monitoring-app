import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CodeSnippet } from 'components/CodeSnippet';

import { SCRIPT_EXAMPLES, TERRAFORM_EXAMPLES } from './constants';
import { WelcomeTab } from './WelcomeTabs';
import { dashboardDark, dashboardLight, privateProbeDark, privateProbeLight } from 'img';

interface Props {
  activeTab: WelcomeTab;
}

export function WelcomeTabContent({ activeTab }: Props) {
  const styles = useStyles2(getStyles);
  switch (activeTab) {
    case WelcomeTab.Protocol:
      return (
        <>
          <div className={styles.text}>Send individual requests via HTTP, DNS, TCP, PING or traceroute</div>

          <img
            src={config.theme2.isDark ? dashboardDark : dashboardLight}
            className={styles.screenshot}
            alt="A dashboard showing statistics about the performance of an HTTP request."
          />
        </>
      );
    case WelcomeTab.K6:
      return (
        <>
          <div className={styles.text}>Use k6 scripts to monitor your services flexibly</div>
          <CodeSnippet
            canCopy={true}
            className={styles.codeSnippet}
            tabs={[
              {
                value: 'Example scripts',
                label: 'k6 Examples',
                groups: SCRIPT_EXAMPLES.map(({ label, script }) => ({
                  value: label,
                  label,
                  code: script,
                  lang: 'js',
                })),
              },
            ]}
            dedent={true}
            lang="js"
          />
        </>
      );
    case WelcomeTab.PrivateProbes:
      return (
        <>
          <div className={styles.text}>
            In addition to the locations we provide out of the box, you can set up your own probes to run inside your
            network or from a location of your choosing
          </div>
          <img
            src={config.theme2.isDark ? privateProbeDark : privateProbeLight}
            className={styles.screenshot}
            alt="A form that allows configuring a private probe."
          />
        </>
      );
    case WelcomeTab.AsCode:
      return (
        <>
          <div className={styles.text}>
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
          </div>
          <CodeSnippet
            canCopy={true}
            className={styles.codeSnippet}
            tabs={[
              {
                value: 'Example scripts',
                label: 'Terraform examples',
                groups: TERRAFORM_EXAMPLES.map(({ label, value }) => ({
                  value: label,
                  label,
                  code: value,
                  lang: 'js',
                })),
              },
            ]}
            dedent={true}
          />
        </>
      );
  }
}

function getStyles(theme: GrafanaTheme2) {
  return {
    screenshot: css({ maxWidth: '100%' }),
    tabContent: css({ marginTop: theme.spacing(4) }),
    codeSnippet: css({ height: '700px' }),
    text: css({
      fontSize: theme.typography.h5.fontSize,
      marginLeft: `auto`,
      marginRight: `auto`,
      maxWidth: `640px`,
    }),
  };
}
