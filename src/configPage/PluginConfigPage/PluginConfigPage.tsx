import React, { useEffect, useState } from 'react';
import { AppPluginMeta, GrafanaTheme2, PluginConfigPageProps } from '@grafana/data';
import { Alert, Badge, Button, Card, Divider, LinkButton, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { ProvisioningJsonData } from 'types';
import { ROUTES } from 'routing/types';
import { getRoute } from 'routing/utils';
import type { SMDataSource } from 'datasource/DataSource';
import { usePluginPermissionCanWrite } from 'hooks/usePluginPermissionsCanWrite';

import { DataSourceInfo, useLinkedDataSources } from './PluginConfigPage.hooks';
import { enablePlugin } from './PluginConfigPage.utils';

function isInitialized(dataSource: SMDataSource | undefined): dataSource is SMDataSource {
  return dataSource?.type === 'synthetic-monitoring-datasource';
}

function getMissingDataSourceTypes(list: DataSourceInfo[]): string[] {
  return ['loki', 'prometheus'].filter((type) => !list.find((ds) => ds.type === type));
}

/**
 * Plugin config page for Synthetic Monitoring
 * This page is shown when the user navigates to the plugin config page (not the app config page).
 * It allows the user to enable the plugin and view linked data sources.
 * Note: Try to keep this component as simple as possible, and avoid adding complex logic as well as App specific logic and context.
 *
 * @param {PluginConfigPageProps<AppPluginMeta<ProvisioningJsonData>>} plugin - The plugin metadata
 * @constructor
 */
export function PluginConfigPage({
  plugin,
}: Omit<PluginConfigPageProps<AppPluginMeta<ProvisioningJsonData>>, 'query'>) {
  const isEnabled = plugin.meta.enabled;
  const appConfigUrl = getRoute(ROUTES.Config);
  const appHomeUrl = getRoute(ROUTES.Home);
  const [isEnabling, setIsEnabling] = useState(false);

  const canWritePlugin = usePluginPermissionCanWrite();

  const { api, linked, isLoading } = useLinkedDataSources();
  const initialized = isInitialized(api?.dataSource);

  const styles = useStyles2(getStyles);

  // Precautionary measure, in case the component would get new props instead of the location being reloaded
  useEffect(() => {
    if (isEnabled) {
      setIsEnabling(false);
    }
  }, [isEnabled]);

  const handleEnable = async () => {
    setIsEnabling(true);
    await enablePlugin(plugin.meta);
  };

  if (isLoading) {
    // This is more or less instant, so no need for a spinner
    return null;
  }

  return (
    <div data-testid={DataTestIds.TEST_PLUGIN_CONFIG_PAGE}>
      {isEnabled && initialized && (
        <Alert title="Synthetic Monitoring config" severity="info">
          Are you looking to configure Synthetic Monitoring? You can do that in the{' '}
          <TextLink href={appConfigUrl}>Synthetic Monitoring app</TextLink>.
        </Alert>
      )}
      {!initialized && (
        <Alert title="Initialization required" severity="info">
          Before you can start using Synthetic Monitoring, the app needs to be initialized. You can do this in the{' '}
          <TextLink href={appConfigUrl}>Synthetic Monitoring app</TextLink>.
        </Alert>
      )}
      <h2 className={styles.heading}>Plugin config</h2>

      {isEnabled && (
        <p>
          For app configuration and settings, go to the <TextLink href={getRoute(ROUTES.Config)}>config page</TextLink>{' '}
          for the Synthetic Monitoring app
        </p>
      )}

      {initialized && (
        <div data-testid={DataTestIds.TEST_PLUGIN_CONFIG_PAGE_LINKED_DATASOURCES}>
          <div className={styles.section}>
            <h3>Data source</h3>
            <Card key={api.name} href={api.url}>
              <Card.Heading>{api.name}</Card.Heading>
              <Card.Figure>
                <img src={api.logo} alt="" width={40} height={40} />
              </Card.Figure>
              <Card.Meta>
                <span>{api.type}</span>
              </Card.Meta>
            </Card>
          </div>

          <section className={styles.section}>
            <h3>Linked data sources ({linked.length})</h3>
            {linked.length < 2 && (
              <Alert title="Configuration issue" severity="warning">
                <div>
                  There was an issue loading one or more linked data sources. If you are experiencing issues using
                  Synthetic Monitoring, seek help on the{' '}
                  <TextLink href="https://community.grafana.com/" external>
                    community site
                  </TextLink>
                  .
                </div>
                <br />
                <div data-testid={DataTestIds.TEST_PLUGIN_CONFIG_PAGE_LINKED_DATASOURCES_ERROR}>
                  <strong>Missing the following data source(s):</strong>&nbsp;
                  <div className={styles.badgeContainer}>
                    {getMissingDataSourceTypes(linked).map((type) => (
                      <Badge color="orange" key={type} text={type} />
                    ))}
                  </div>
                </div>
              </Alert>
            )}

            {linked.map((ds) => (
              <Card key={ds.name} href={ds.url}>
                <Card.Heading>{ds.name}</Card.Heading>
                <Card.Figure>
                  <img src={ds.logo} alt="" width={40} height={40} />
                </Card.Figure>
                <Card.Meta>
                  <span>{ds.type}</span>
                </Card.Meta>
              </Card>
            ))}
          </section>
        </div>
      )}

      <Divider />

      {isEnabled && <LinkButton href={appHomeUrl}>Go to the Synthetic Monitoring app</LinkButton>}
      {!isEnabled && (
        <Button
          disabled={!canWritePlugin}
          tooltip={!canWritePlugin ? 'Insufficient permissions for enabling plugins ' : undefined}
          icon={isEnabling ? 'fa fa-spinner' : undefined}
          onClick={handleEnable}
        >
          Enable Synthetic Monitoring
        </Button>
      )}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    heading: css({
      ...theme.typography.h1,
    }),
    section: css({
      marginBottom: theme.spacing(4),
    }),
    badgeContainer: css({
      display: 'inline-flex',
      gap: theme.spacing(1),
    }),
  };
}
