import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ProbeWithMetadata } from 'types';
import { useProbesWithMetadata } from 'data/useProbes';
import { ChunkyLoadingBar } from 'components/ChunkyLoadingBar/ChunkyLoadingBar';
import { ProbeResultUnknown } from 'scenes/components/TimepointExplorer/ProbeResultUnknown';
import { useTimepointVizOptions } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

import { grotPropsList } from 'img';

interface ProbeResultPendingProps {
  probeName: string;
  timepoint: StatelessTimepoint;
}

export const ProbeResultPending = ({ probeName, timepoint }: ProbeResultPendingProps) => {
  const { data: probes = [] } = useProbesWithMetadata();
  const probe = probes.find((p) => p.name === probeName);
  const name = probe?.displayName || probeName;

  return (
    <ProbeResultUnknown title={`Waiting on results for ${name}...`} image={<PendingGrot />}>
      {probe ? <ProbeExists probe={probe} timepoint={timepoint} /> : <ProbeUnknown />}
    </ProbeResultUnknown>
  );
};

const PendingGrot = () => {
  const color = useTimepointVizOptions('pending').statusColor;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <img src={grotPropsList} alt="" />
      <div className={styles.goggles}>
        <ChunkyLoadingBar direction="horizontal" height={32} width={110} color={color} />
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    position: relative;
  `,
  goggles: css`
    position: absolute;
    top: 110px;
    left: 143px;
    width: 110px;
    height: 32px;
    border-radius: 30px;
    background-color: ${theme.colors.background.canvas};
    overflow: hidden;
  `,
});

const ProbeExists = ({ probe, timepoint }: { probe: ProbeWithMetadata; timepoint: StatelessTimepoint }) => {
  const { region, public: isPublic, online, onlineChange } = probe;

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
      <Text>
        Its status right now is{' '}
        <Text element={`span`} color={online ? 'success' : 'error'} weight="bold">
          {online ? `online` : `offline`}
        </Text>
        .
      </Text>
      {!online && <Text>It was last online at {new Date(onlineChange * 1000).toLocaleString()}.</Text>}
    </>
  );
};

const ProbeUnknown = () => {
  return <div>This probe was deleted.</div>;
};
