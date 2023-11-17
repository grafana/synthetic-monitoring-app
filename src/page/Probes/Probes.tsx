import React from 'react';
import { OrgRole } from '@grafana/data';
import { LinkButton, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

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
      <ProbesContent {...props} />
    </PluginPage>
  );
};

const Actions = () => {
  if (!hasRole(OrgRole.Editor)) {
    return null;
  }

  return <LinkButton href={getRoute(ROUTES.NewProbe)}>Add Private Probe</LinkButton>;
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
      <ProbeList probes={privateProbes} title="Private Probes" emptyText={<PrivateProbesEmptyText />} />
      <ProbeList probes={publicProbes} title="Public Probes" />
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
