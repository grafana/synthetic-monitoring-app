import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { LinkButton, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { ExtendedProbe } from 'types';
import { ROUTES } from 'routing/types';
import { getRoute } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';
import { useExtendedProbes } from 'data/useProbes';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { DocsLink } from 'components/DocsLink';
import { ProbeList } from 'components/ProbeList';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

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
  const { canWriteProbes } = getUserPermissions();
  if (!canWriteProbes) {
    return null;
  }

  return <LinkButton href={getRoute(ROUTES.NewProbe)}>Add Private Probe</LinkButton>;
};

const ProbesContent = () => {
  const [extendedProbes, isLoading] = useExtendedProbes();

  if (isLoading) {
    return <CenteredSpinner />;
  }

  const initial: {
    publicProbes: ExtendedProbe[];
    privateProbes: ExtendedProbe[];
  } = {
    publicProbes: [],
    privateProbes: [],
  };

  const { publicProbes, privateProbes } = extendedProbes
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
