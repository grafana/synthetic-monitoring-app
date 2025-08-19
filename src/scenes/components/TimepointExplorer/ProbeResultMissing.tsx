import React from 'react';
import { Alert, Stack, Text, TextLink } from '@grafana/ui';

import { ProbeWithMetadata } from 'types';
import { useProbesWithMetadata } from 'data/useProbes';
import { getExploreUrl } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Ul } from 'components/Ul';
import { ProbeResultUnknown } from 'scenes/components/TimepointExplorer/ProbeResultUnknown';
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
    <ProbeResultUnknown
      title={`${name} didn't return a result for this timepoint`}
      image={<img src={grotPropsMagnifyingGlass} alt="" />}
    >
      {probe ? <ProbeExists probe={probe} timepoint={timepoint} /> : <ProbeUnknown />}
    </ProbeResultUnknown>
  );
};

const ProbeExists = ({ probe, timepoint }: { probe: ProbeWithMetadata; timepoint: StatelessTimepoint }) => {
  const { region, public: isPublic, online, onlineChange } = probe;
  const metricsDS = useMetricsDS();
  const exploreLink = getExploreUrl(metricsDS?.uid!, [`probe_success{probe="${probe.name}"}`], {
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
        We are unable to determine this probe&apos;s status when this execution was scheduled. It may be worth checking
        if this probe reported any results for other checks that ran at{' '}
        <TextLink href={exploreLink} external>
          the same time
        </TextLink>
        .
      </div>
      <Text>
        Its status right now is{' '}
        <Text element={`span`} color={online ? 'success' : 'error'} weight="bold">
          {online ? `online` : `offline`}
        </Text>
        .
      </Text>
      <Text>
        It was last {online ? `offline` : `online`} at {new Date(onlineChange * 1000).toLocaleString()}.
      </Text>
      <ReasonsForMissingResult isPublic={isPublic} />
    </>
  );
};

const ReasonsForMissingResult = ({ isPublic }: { isPublic: boolean }) => {
  return (
    <Alert title="Reasons for missing probe results:" severity="info">
      <Stack direction="column" gap={2}>
        <Ul>
          <li>The probe may have been offline</li>
          {!isPublic && <li>The probe&apos;s credentials may have expired</li>}
          <li>The probe may have been restarted or the check was updated when this execution was scheduled</li>
          <li>
            If the probe was scheduled to run right at the end of this timepoint, it may have began its execution in the
            timepoint after this one and reported its results there instead.
          </li>
        </Ul>
        <Text>
          Occasional missing probe results are normal due to the nature of the internet and the probe agent&apos;s
          scheduling system but if probe results are consistently missing, it may indicate a larger problem that needs
          investigating.
        </Text>
      </Stack>
    </Alert>
  );
};

const ProbeUnknown = () => {
  return <div>This probe was deleted.</div>;
};
