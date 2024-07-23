import React from 'react';
import { LinkButton, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { type Probe, ROUTES } from 'types';
import { useProbes } from 'data/useProbes';
import { useCanWriteSM } from 'hooks/useDSPermission';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { DocsLink } from 'components/DocsLink';
import { PluginPage } from 'components/PluginPage';
import { ProbeList } from 'components/ProbeList';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { getRoute } from 'components/Routing.utils';

export const Probes = () => {
  const theme = useTheme2();

  return (
    <PluginPage actions={<Actions />}>
      <div className={css({ maxWidth: `560px`, marginBottom: theme.spacing(4) })}>
        <p>
          Probes are the agents responsible for emulating user interactions and collecting data from your specified
          targets across different global locations.
        </p>
        <DocsLink article="probes">Learn more about probes</DocsLink>
      </div>
      <QueryErrorBoundary>
        <ProbesContent />
      </QueryErrorBoundary>
    </PluginPage>
  );
};

const Actions = () => {
  const canEdit = useCanWriteSM();
  if (!canEdit) {
    return null;
  }

  return <LinkButton href={getRoute(ROUTES.NewProbe)}>Add Private Probe</LinkButton>;
};

const ProbesContent = () => {
  const { data: probes = [], isLoading } = useProbes();

  if (isLoading) {
    return <CenteredSpinner />;
  }

  const initial: {
    publicProbes: Probe[];
    privateProbes: Probe[];
  } = {
    publicProbes: [],
    privateProbes: [],
  };

  const { publicProbes, privateProbes } = probes
    .sort((probeA, probeB) => probeA.name.localeCompare(probeB.name))
    .filter((probe) => Boolean(probe.id))
    .reduce((acc, probe) => {
      if (!probe.id) {
        return acc;
      }

      if (probe.public) {
        return {
          ...acc,
          publicProbes: [...acc.publicProbes, probe],
        };
      }

      return {
        ...acc,
        privateProbes: [...acc.privateProbes, probe],
      };
    }, initial);

  return (
    <>
      <ProbeList
        data-testid={DataTestIds.PRIVATE_PROBES_LIST}
        probes={privateProbes}
        title="Private Probes"
        emptyText={<PrivateProbesEmptyText />}
      />
      <ProbeList data-testid={DataTestIds.PUBLIC_PROBES_LIST} probes={publicProbes} title="Public Probes" />
    </>
  );
};

const PrivateProbesEmptyText = () => {
  return (
    <>
      <div>No private probes have been added yet.</div>
      Read more about <DocsLink article="privateProbes">private probes in our documentation.</DocsLink>
    </>
  );
};
