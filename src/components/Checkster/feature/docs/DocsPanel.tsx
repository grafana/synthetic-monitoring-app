import React from 'react';
import { TextLink, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';

export const DOCS_CHECK_COMPATABILITY: CheckType[] = [];

export function DocsPanel() {
  const theme = useTheme2();
  return (
    <div
      className={css`
        padding: ${theme.spacing(2)};
      `}
    >
      <h3>Docs</h3>
      <p>
        Synthetic Monitoring checks are tests that run on selected public or private probes at frequent intervals to
        continuously verify your systems.
      </p>
      <p>
        Checks save results as Prometheus metrics and Loki logs, enabling the configuration of Grafana alerts for custom
        notifications and incident management.
      </p>
      <ul
        className={css`
          padding-left: ${theme.spacing(2)};
        `}
      >
        <li>
          <TextLink
            external
            href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/"
          >
            Check types and what they do
          </TextLink>
        </li>
        <li>
          <TextLink
            external
            href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/public-probes/"
          >
            Public probes
          </TextLink>
        </li>
        <li>
          <TextLink
            external
            href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/manage-secrets/"
          >
            Create and manage secrets
          </TextLink>
        </li>
      </ul>
    </div>
  );
}
