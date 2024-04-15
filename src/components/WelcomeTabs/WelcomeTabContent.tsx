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
          <p>Send individual requests via HTTP, DNS, TCP, PING or a traceroute</p>

          <img src={config.theme2.isDark ? dashboardDark : dashboardLight} className={styles.screenshot} />
        </>
      );
    case WelcomeTab.K6:
      return (
        <>
          <p>Use k6 scripts to monitor your services flexibly</p>
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
            initialTab="initialize"
            code="console.log('hello world')"
          />
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
    screenshot: css({ height: '700px' }),
    tabContent: css({ marginTop: theme.spacing(4) }),
    codeSnippet: css({ height: '700px' }),
  };
}
