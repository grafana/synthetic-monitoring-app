import React from 'react';
import { config } from '@grafana/runtime';
import { Alert, Space, TextLink } from '@grafana/ui';

import { getUserPermissions } from 'data/permissions';
import { useMeta } from 'hooks/useMeta';
import { LinkedDatasourceView } from 'components/LinkedDatasourceView';
import { ProbeAPIServer } from 'components/ProbeAPIServer';

import { ConfigContent } from '../ConfigContent';

export function GeneralTab() {
  const meta = useMeta();
  // This may be false in play.grafana.net
  const isSignedIn = config.bootData.user?.isSignedIn ?? false;
  const { canWriteSM } = getUserPermissions();

  return (
    <>
      {!isSignedIn && (
        <ConfigContent.Section>
          <Alert title="Grafana cloud" severity="info">
            Synthetic Monitoring is a blackbox monitoring solution provided as part of{' '}
            <TextLink href="https://grafana.com/products/cloud/" external>
              Grafana Cloud
            </TextLink>
            . If you don&apos;t already have a Grafana Cloud service,{' '}
            <TextLink href="https://grafana.com/signup/cloud" external>
              sign up now
            </TextLink>
            .
          </Alert>
        </ConfigContent.Section>
      )}
      <ConfigContent title="General">
        <ConfigContent.Section title="Private probes">
          In addition to the public probes run by Grafana Labs, you can also{' '}
          <TextLink
            href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/"
            external
          >
            install private probes
          </TextLink>
          . These are only accessible to you and only write data to your Grafana Cloud account. Private probes are
          instances of the open source Grafana{' '}
          <TextLink icon="github" href="https://www.github.com/grafana/synthetic-monitoring-agent">
            Synthetic Monitoring Agent
          </TextLink>
          .
          <Space v={2} />
          <ProbeAPIServer />
        </ConfigContent.Section>

        <ConfigContent.Section title="Data sources">
          <LinkedDatasourceView type="synthetic-monitoring-datasource" />
          <LinkedDatasourceView type="prometheus" />
          <LinkedDatasourceView type="loki" />
        </ConfigContent.Section>

        <ConfigContent.Section>
          {canWriteSM ? <TextLink href={`/plugins/${meta.id}`}>Plugin</TextLink> : 'Plugin'} version:{' '}
          {meta.info.version}
        </ConfigContent.Section>
      </ConfigContent>
    </>
  );
}
