import React from 'react';
import { OrgRole } from '@grafana/data';
import { HorizontalGroup, LinkButton } from '@grafana/ui';

import { type Probe, ROUTES } from 'types';
import { hasRole } from 'utils';
import { PluginPage } from 'components/PluginPage';
import { ProbeList } from 'components/ProbeList';
import { getRoute } from 'components/Routing';

export const Probes = ({ probes }: { probes: Probe[] }) => {
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
    <PluginPage>
      <ProbeList probes={publicProbes} title="Public Probes" />
      <ProbeList probes={privateProbes} title="Private Probes" />
      {hasRole(OrgRole.Editor) && (
        <HorizontalGroup justify="flex-end" height="auto">
          <LinkButton href={getRoute(ROUTES.NewProbe)}>Add Private Probe</LinkButton>
        </HorizontalGroup>
      )}
    </PluginPage>
  );
};
