import React, { useEffect, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Tab, TabContent,TabsBar, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FaroEvent, reportEvent } from 'faro';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';
import { useTerraformConfig } from 'hooks/useTerraformConfig';
import { Clipboard } from 'components/Clipboard';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { ConfigContent } from '../ConfigContent';
import { TerraformConfigDisplay } from './TerraformConfigDisplay';

type ConfigFormat = 'hcl' | 'json';

export function TerraformTab() {
  const { config, hclConfig, checkCommands, probeCommands, error, isLoading, checkAlertsCommands } = useTerraformConfig();
  const styles = useStyles2(getStyles);
  const { canReadChecks, canReadProbes } = getUserPermissions();
  const [activeFormat, setActiveFormat] = useState<ConfigFormat>('hcl');
  
  useEffect(() => {
    reportEvent(FaroEvent.SHOW_TERRAFORM_CONFIG);
  }, []);

  if (isLoading) {
    return <ConfigContent loading={isLoading} title="Terraform config" />;
  }

  if (!canReadChecks && !canReadProbes) {
    return (
      <ContactAdminAlert
        title="Contact your administrator to gain access to Terraform data"
        missingPermissions={[
          'grafana-synthetic-monitoring-app.checks:read',
          'grafana-synthetic-monitoring-app.probes:read',
        ]}
      />
    );
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
          <TextLink href={`${generateRoutePath(AppRoutes.Config)}/access-tokens`}>
            Synthetic Monitoring access token
          </TextLink>
        </div>
      </ConfigContent.Section>

      <ConfigContent.Section title="Exported config">
        <TabsBar>
          <Tab
            label="HCL"
            active={activeFormat === 'hcl'}
            onChangeTab={() => setActiveFormat('hcl')}
          />
          <Tab
            label="JSON"
            active={activeFormat === 'json'}
            onChangeTab={() => setActiveFormat('json')}
          />
        </TabsBar>
        
        <TabContent>
          {activeFormat === 'hcl' ? (
            <TerraformConfigDisplay
              title="Terraform HCL"
              syntaxName="Terraform HCL syntax"
              docsUrl="https://www.terraform.io/docs/language/syntax/configuration.html"
              fileExtension=".tf"
              content={hclConfig}
            />
          ) : (
            <TerraformConfigDisplay
              title="Terraform JSON"
              syntaxName="Terraform JSON syntax"
              docsUrl="https://www.terraform.io/docs/language/syntax/json.html"
              fileExtension="tf.json"
              content={JSON.stringify(config, null, 2)}
            />
          )}
        </TabContent>
      </ConfigContent.Section>

      {checkCommands && (
        <ConfigContent.Section title="Import existing checks into Terraform">
          <Clipboard content={checkCommands.join(' && \\\n')} className={styles.clipboard} isCode />
        </ConfigContent.Section>
      )}

      {checkAlertsCommands && checkAlertsCommands.length > 0 && (
        <ConfigContent.Section title="Import check alerts into Terraform">
          <Clipboard content={checkAlertsCommands.join(' && \\\n')} className={styles.clipboard} isCode />
        </ConfigContent.Section>
      )}

      {probeCommands && (
        <ConfigContent.Section title="Import custom probes into Terraform">
          <Text element="span" color="secondary">
            Replace{' '}
            <TextLink href={`${generateRoutePath(AppRoutes.Config)}/access-tokens`}>
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
