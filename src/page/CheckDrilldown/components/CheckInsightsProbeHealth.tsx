import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe } from 'types';
import { useProbes } from 'data/useProbes';
import { CheckInsight } from 'page/CheckDrilldown/components/CheckInsight';
import { useCheckDrilldownInfo } from 'page/CheckDrilldown/hooks/useCheckDrilldownInfo';
import { useCheckProbeHealth } from 'page/CheckDrilldown/hooks/useCheckProbeHealth';

export const CheckInsightsProbeHealth = () => {
  const { probes, allProbesRunning, probesWithResults } = useCheckProbeHealth();

  const health = allProbesRunning ? 'good' : 'bad';
  const description = allProbesRunning
    ? `All probes are reporting results`
    : `Only ${probesWithResults.length} out of ${probes.length} probes have returned results for this time range`;

  return (
    <div>
      <CheckInsight label={`Probe health`} health={health} description={description}>
        <SimpleHTMLTable checkProbes={probes} />
      </CheckInsight>
    </div>
  );
};

const SimpleHTMLTable = ({ checkProbes }: { checkProbes: number[] }) => {
  const { data: probes = [] } = useProbes();
  const filteredProbes = probes.filter((probe) => probe.id && checkProbes.includes(probe.id));
  const styles = useStyles2(getStyles);
  const { timeseries, timePoints } = useCheckDrilldownInfo();

  const data = useMemo(() => {
    return filteredProbes.map((probe) => {
      const probeResults = timeseries.probeSuccess[probe.name];
      const resultsLength = probeResults?.length ?? 0;
      const executionPercentage = (resultsLength / timePoints.length) * 100;

      return {
        probe,
        executionPercentage,
      };
    });
  }, [filteredProbes, timeseries, timePoints]);

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Probe Name</th>
          <th>Execution Percentage</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data
          .sort((a, b) => b.executionPercentage - a.executionPercentage)
          .map((d) => (
            <ProbeRow key={d.probe.id} {...d} />
          ))}
      </tbody>
    </table>
  );
};

const ProbeRow = ({ probe, executionPercentage }: { probe: Probe; executionPercentage: number }) => {
  const percentage = executionPercentage ? executionPercentage.toFixed(2) : 'N/A';

  return (
    <tr>
      <td>{probe.name}</td>
      <td>{percentage}%</td>
      <td>{probe.online ? 'Online' : 'Offline'}</td>
    </tr>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    table: css`
      width: 100%;
      border-collapse: separate;
    `,
  };
};
