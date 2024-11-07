import React from 'react';
import { config } from '@grafana/runtime';
import { TextLink } from '@grafana/ui';

import { useBackendAddress } from 'hooks/useBackendAddress';
import { useCanWriteSM } from 'hooks/useDSPermission';
import { useMeta } from 'hooks/useMeta';
import { LinkedDatasourceView } from 'components/LinkedDatasourceView';

import { Preformatted } from '../../../components/Preformatted';
import { ConfigContent } from '../ConfigContent';

export function GeneralTab() {
  const meta = useMeta();
  // This may be false in play.grafana.net
  const isSignedIn = config.bootData.user?.isSignedIn ?? false;
  const canWriteSM = useCanWriteSM();
  const [backendAddress, backendAddressDescription] = useBackendAddress(true);

  return (
    <ConfigContent title="General">
      <ConfigContent.Section>
        <h4>Private probes</h4>
        <p>
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
        </p>

        <h5>Backend address</h5>
        <p>{backendAddressDescription}</p>
        <Preformatted>{backendAddress}</Preformatted>
      </ConfigContent.Section>

      <ConfigContent.Section>
        {!isSignedIn && (
          <p>
            Synthetic Monitoring is a blackbox monitoring solution provided as part of{' '}
            <TextLink href="https://grafana.com/products/cloud/" external>
              Grafana Cloud
            </TextLink>
            . If you don&apos;t already have a Grafana Cloud service,{' '}
            <TextLink href="https://grafana.com/signup/cloud" external>
              sign up now
            </TextLink>
            .
          </p>
        )}

        <h3>Data Sources</h3>
        <div>
          <LinkedDatasourceView type="synthetic-monitoring-datasource" />
          <LinkedDatasourceView type="prometheus" />
          <LinkedDatasourceView type="loki" />
        </div>
      </ConfigContent.Section>

      <ConfigContent.Section>
        {canWriteSM ? <TextLink href={`/plugins/${meta.id}`}>Plugin</TextLink> : 'Plugin'} version: {meta.info.version}
      </ConfigContent.Section>
    </ConfigContent>
  );
}
