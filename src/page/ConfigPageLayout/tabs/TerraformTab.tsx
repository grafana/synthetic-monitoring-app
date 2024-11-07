import React, { useEffect } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { generateRoutePath } from 'routes';

import { ROUTES } from 'types';
import { FaroEvent, reportEvent } from 'faro';
import { useTerraformConfig } from 'hooks/useTerraformConfig';
import { Clipboard } from 'components/Clipboard';

import { ConfigContent } from '../ConfigContent';

export function TerraformTab() {
  const { config, checkCommands, probeCommands, error, isLoading } = useTerraformConfig();
  const styles = useStyles2(getStyles);
  useEffect(() => {
    reportEvent(FaroEvent.SHOW_TERRAFORM_CONFIG);
  }, []);

  if (isLoading) {
    return <ConfigContent loading={isLoading} title="Terraform config" />;
  }

  return (
    <ConfigContent title="Terraform config">
      {error && <Alert title={error.message} />}
      <div>
        <p>
          You can manage Synthetic monitoring checks using Terraform as well as export your current checks as
          configuration.
        </p>
      </div>
      <div>
        <h5>Prerequisites</h5>
        <div>
          <TextLink href="https://grafana.com/docs/grafana/latest/administration/service-accounts/" external>
            Grafana API key
          </TextLink>
        </div>
        <div>
          <TextLink href={`${generateRoutePath(ROUTES.Config)}/access-tokens`}>
            Synthetic monitoring access token
          </TextLink>
        </div>

        <br />
        <Alert title="Terraform and JSON" severity="info">
          The exported config is using{' '}
          <a href="https://www.terraform.io/docs/language/syntax/json.html">Terraform JSON syntax</a>. You can place
          this config in a file with a <code>tf.json</code> extension and import as a module. See the{' '}
          <TextLink href="https://registry.terraform.io/providers/grafana/grafana/latest/docs" external={true}>
            Terraform provider docs
          </TextLink>{' '}
          for more details.
        </Alert>

        <h6>tf.json</h6>
        <Text element="p" color="secondary">
          Replace{' '}
          <TextLink href="https://grafana.com/docs/grafana/latest/administration/service-accounts/" external>
            <strong className={styles.codeLink}>&lt;GRAFANA_SERVICE_TOKEN&gt;</strong>
          </TextLink>{' '}
          and{' '}
          <TextLink href={`${generateRoutePath(ROUTES.Config)}/access-tokens`}>
            <strong className={styles.codeLink}>&lt;SM_ACCESS_TOKEN&gt;</strong>
          </TextLink>
          , with their respective value.
        </Text>
        <Clipboard
          highlight={['<GRAFANA_SERVICE_TOKEN>', '<SM_ACCESS_TOKEN>']}
          content={JSON.stringify(config, null, 2)}
          className={styles.clipboard}
          isCode
        />
      </div>
      {checkCommands && (
        <>
          <h4>Import existing checks into Terraform</h4>
          <Clipboard content={checkCommands.join(' && \\\n')} className={styles.clipboard} isCode />
        </>
      )}
      {probeCommands && (
        <>
          <h4>Import custom probes into Terraform</h4>
          <Text element="p" color="secondary">
            Replace{' '}
            <TextLink href={`${generateRoutePath(ROUTES.Config)}/access-tokens`}>
              <strong className={styles.codeLink}>&lt;PROBE_ACCESS_TOKEN&gt;</strong>
            </TextLink>{' '}
            with each probe&apos;s access token.
          </Text>

          <Clipboard
            highlight="<PROBE_ACCESS_TOKEN>"
            content={probeCommands.join(' && \\\n')}
            className={styles.clipboard}
            isCode
          />
        </>
      )}
    </ConfigContent>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    clipboard: css`
      max-height: 500px;
      margin-top: 10px;
      margin-bottom: 10px;
    `,
    codeLink: css({
      fontFamily: theme.typography.code.fontFamily,
      fontSize: '0.8571428571em',
    }),
  };
}
