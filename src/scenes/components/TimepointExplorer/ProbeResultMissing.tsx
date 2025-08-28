import React from 'react';
import { dateTimeFormat } from '@grafana/data';
import { Text, TextLink } from '@grafana/ui';

import { ProbeWithMetadata } from 'types';
import { getExploreUrl } from 'utils';
import { useProbesWithMetadata } from 'data/useProbes';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { ReasonsForMissingResult } from 'scenes/components/TimepointExplorer/ReasonsForMissingResult';
import { ResultUnknown } from 'scenes/components/TimepointExplorer/ResultUnknown';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

import { grotPropsMagnifyingGlass } from 'img';

interface ProbeResultMissingProps {
  probeName: string;
  timepoint: StatelessTimepoint;
}

export const ProbeResultMissing = ({ probeName, timepoint }: ProbeResultMissingProps) => {
  const { data: probes = [] } = useProbesWithMetadata();
  const probe = probes.find((p) => p.name === probeName);
  const name = probe?.displayName || probeName;

  return (
    <ResultUnknown
      title={`No result found from ${name} for this timepoint`}
      image={<img src={grotPropsMagnifyingGlass} alt="" />}
    >
      {probe ? <ProbeExists probe={probe} timepoint={timepoint} /> : <ProbeUnknown />}
    </ResultUnknown>
  );
};

const ProbeExists = ({ probe, timepoint }: { probe: ProbeWithMetadata; timepoint: StatelessTimepoint }) => {
  const { region, public: isPublic, online, onlineChange } = probe;
  const metricsDS = useMetricsDS();
  const exploreLink = getExploreUrl(metricsDS?.uid!, [{ expr: `probe_success{probe="${probe.name}"}` }], {
    from: timepoint.adjustedTime,
    to: timepoint.adjustedTime + timepoint.timepointDuration,
  });

  return (
    <>
      <div>
        This is a{' '}
        <Text element={`span`} weight="bold">
          {isPublic ? `public` : `private`}
        </Text>{' '}
        probe in{' '}
        <Text element={`span`} weight="bold">
          {region}
        </Text>
        .
      </div>
      <div>
        We cannot determine this probe&apos;s status when the check was scheduled. Check if this probe reported results
        for other checks that ran at{' '}
        <TextLink href={exploreLink} external>
          the same time
        </TextLink>
        .
      </div>
      <Text>
        Current status:{' '}
        <Text element={`span`} color={online ? 'success' : 'error'} weight="bold">
          {online ? `online` : `offline`}
        </Text>
        .
      </Text>
      {!isPublic && (
        <Text>
          Last {online ? `offline` : `online`}: {dateTimeFormat(onlineChange * 1000)}
        </Text>
      )}
      <ReasonsForMissingResult isPublic={isPublic} />
    </>
  );
};

const ProbeUnknown = () => {
  return <div>This probe was deleted.</div>;
};
