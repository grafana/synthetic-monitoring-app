import React from 'react';
import { OrgRole } from '@grafana/data';
import { HorizontalGroup, LinkButton } from '@grafana/ui';

import { type Probe, ROUTES } from 'types';
import { hasRole } from 'utils';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { DocsLink } from 'components/DocsLink';
import { ErrorAlert } from 'components/ErrorAlert';
import { PluginPage } from 'components/PluginPage';
import { ProbeList } from 'components/ProbeList';
import { getRoute } from 'components/Routing';

type ProbesProps = { loading: boolean; probes: Probe[]; error: string | null };

export const Probes = (props: ProbesProps) => {
  return (
    <PluginPage>
      <ProbesContent {...props} />
    </PluginPage>
  );
};

const ProbesContent = ({ error, loading, probes }: ProbesProps) => {
  if (error) {
    return <ErrorAlert buttonText={`Reload`} onClick={() => window.location.reload()} />;
  }

  if (loading) {
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
      <ProbeList probes={publicProbes} title="Public Probes" />
      <ProbeList probes={privateProbes} title="Private Probes" emptyText={<PrivateProbesEmptyText />} />
      {hasRole(OrgRole.Editor) && (
        <HorizontalGroup justify="center" height="auto">
          <LinkButton href={getRoute(ROUTES.NewProbe)}>Add Private Probe</LinkButton>
        </HorizontalGroup>
      )}
    </>
  );
};

const PrivateProbesEmptyText = () => {
  return (
    <>
      No private probes have been added yet. Read more about{' '}
      <DocsLink article="privateProbes">private probes in our documentation.</DocsLink>
    </>
  );
};
