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
      <p>
        You can manage Synthetic monitoring checks using Terraform as well as export your current checks as
        configuration.
      </p>

      <ConfigContent.Section title="Prerequisites">
        <div>
          <TextLink href="https://grafana.com/docs/grafana/latest/administration/service-accounts/" external>
            Grafana API key
          </TextLink>
        </div>

        <div>
          <TextLink href={`${generateRoutePath(ROUTES.Config)}/access-tokens`}>
            Synthetic Monitoring access token
          </TextLink>
        </div>
      </ConfigContent.Section>

      <ConfigContent.Section title="Exported config">
        <Alert title="Terraform and JSON" severity="info">
          The exported config is using{' '}
          <TextLink href="https://www.terraform.io/docs/language/syntax/json.html" external>
            Terraform JSON syntax
          </TextLink>
          . You can place this config in a file with a <code>tf.json</code> extension and import as a module. See the{' '}
          <TextLink href="https://registry.terraform.io/providers/grafana/grafana/latest/docs" external>
            Terraform provider docs
          </TextLink>{' '}
          for more details.
        </Alert>
        <Text element="span" color="secondary">
          Replace{' '}
          <TextLink href="https://grafana.com/docs/grafana/latest/administration/service-accounts/" external>
            <strong className={styles.codeLink}>{'<GRAFANA_SERVICE_TOKEN>'}</strong>
          </TextLink>{' '}
          and{' '}
          <TextLink href={`${generateRoutePath(ROUTES.Config)}/access-tokens`}>
            <strong className={styles.codeLink}>{'<SM_ACCESS_TOKEN>'}</strong>
          </TextLink>
          , with their respective value.
        </Text>
        <Clipboard
          highlight={['<GRAFANA_SERVICE_TOKEN>', '<SM_ACCESS_TOKEN>']}
          content={JSON.stringify(config, null, 2)}
          className={styles.clipboard}
          isCode
        />
      </ConfigContent.Section>

      {checkCommands && (
        <ConfigContent.Section title="Import existing checks into Terraform">
          <Clipboard content={checkCommands.join(' && \\\n')} className={styles.clipboard} isCode />
        </ConfigContent.Section>
      )}

      {probeCommands && (
        <ConfigContent.Section title="Import custom probes into Terraform">
          <Text element="span" color="secondary">
            Replace{' '}
            <TextLink href={`${generateRoutePath(ROUTES.Config)}/access-tokens`}>
              <strong className={styles.codeLink}>{'<PROBE_ACCESS_TOKEN>'}</strong>
            </TextLink>{' '}
            with each probe&apos;s access token.
          </Text>

          <Clipboard
            highlight="<PROBE_ACCESS_TOKEN>"
            content={probeCommands.join(' && \\\n')}
            className={styles.clipboard}
            isCode
          />
        </ConfigContent.Section>
      )}
    </ConfigContent>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    clipboard: css({
      maxHeight: 500,
      marginTop: 10,
      marginBottom: 10,
    }),
    codeLink: css({
      fontFamily: theme.typography.code.fontFamily,
      fontSize: '0.8571428571em',
    }),
  };
}
