import React, { useEffect, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Tab, TabContent, TabsBar, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FaroEvent, reportEvent } from 'faro';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';
import { useTerraformConfig } from 'hooks/useTerraformConfig';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { ConfigContent } from '../ConfigContent';
import { CodeBlockDisplay } from './CodeBlockDisplay';
import { TerraformConfigDisplay } from './TerraformConfigDisplay';

type ConfigFormat = 'hcl' | 'json';
type ImportFormat = 'cli' | 'blocks';

export function TerraformTab() {
  const {
    config,
    hclConfig,
    checkCommands,
    probeCommands,
    error,
    isLoading,
    checkAlertsCommands,
    checkImportBlocks,
    checkAlertsImportBlocks,
    probeImportBlocks,
  } = useTerraformConfig();
  const styles = useStyles2(getStyles);
  const { canReadChecks, canReadProbes } = getUserPermissions();
  const [activeFormat, setActiveFormat] = useState<ConfigFormat>('hcl');
  const [importFormat, setImportFormat] = useState<ImportFormat>('cli');

  useEffect(() => {
    reportEvent(FaroEvent.ShowTerraformConfig);
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

      {(checkCommands.length > 0 || checkAlertsCommands.length > 0 || probeCommands.length > 0) && (
        <ConfigContent.Section title="Import existing resources into Terraform">
          <TabsBar>
            <Tab
              label="CLI commands"
              active={importFormat === 'cli'}
              onChangeTab={() => setImportFormat('cli')}
            />
            <Tab
              label="Import blocks"
              active={importFormat === 'blocks'}
              onChangeTab={() => setImportFormat('blocks')}
            />
          </TabsBar>

          <TabContent>
            {importFormat === 'cli' ? (
              <>
                {checkCommands.length > 0 && (
                  <div className={styles.cliSection}>
                    <CodeBlockDisplay
                      content={checkCommands.join(' && \\\n')}
                      title="Import checks"
                      language="bash"
                    />
                  </div>
                )}

                {checkAlertsCommands.length > 0 && (
                  <div className={styles.cliSection}>
                    <CodeBlockDisplay
                      content={checkAlertsCommands.join(' && \\\n')}
                      title="Import check alerts"
                      language="bash"
                    />
                  </div>
                )}

                {probeCommands.length > 0 && (
                  <div className={styles.cliSection}>
                    <CodeBlockDisplay
                      content={probeCommands.join(' && \\\n')}
                      title="Import custom probes"
                      language="bash"
                      showProbeTokenWarning
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                {checkCommands.length > 0 && (
                  <div className={styles.cliSection}>
                    <CodeBlockDisplay content={checkImportBlocks.join('\n\n')} title="Import checks" language="hcl" />
                  </div>
                )}

                {checkAlertsCommands.length > 0 && (
                  <div className={styles.cliSection}>
                    <CodeBlockDisplay
                      content={checkAlertsImportBlocks.join('\n\n')}
                      title="Import check alerts"
                      language="hcl"
                    />
                  </div>
                )}

                {probeCommands.length > 0 && (
                  <div className={styles.cliSection}>
                    <CodeBlockDisplay
                      content={probeImportBlocks.join('\n\n')}
                      title="Import custom probes"
                      language="hcl"
                      showProbeTokenWarning
                    />
                  </div>
                )}
              </>
            )}
          </TabContent>
        </ConfigContent.Section>
      )}
    </ConfigContent>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    cliSection: css({
      marginTop: theme.spacing(3),
    }),
  };
}
