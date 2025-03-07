import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe } from 'types';
import { useProbes } from 'data/useProbes';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { CheckInsight } from 'page/CheckDrilldown/components/CheckInsight';
import { useTimeRange } from 'page/CheckDrilldown/components/TimeRangeContext';
import { useCheckDrilldownInfo } from 'page/CheckDrilldown/hooks/useCheckDrilldownInfo';
import { useCheckProbeHealth } from 'page/CheckDrilldown/hooks/useCheckProbeHealth';

export const CheckInsightsProbeHealth = () => {
  const { check } = useCheckDrilldown();
  const { timeRange } = useTimeRange();
  const { allProbesRunning, data = {} } = useCheckProbeHealth({ check, timeRange });
  const probesWithResults = Object.keys(data);

  const health = allProbesRunning ? 'good' : 'bad';
  const description = allProbesRunning
    ? `All probes are reporting results`
    : `Only ${probesWithResults.length} out of ${check.probes.length} probes have returned results for this time range`;

  return (
    <div>
      <CheckInsight label={`Probe health`} health={health} description={description}>
        <SimpleHTMLTable checkProbes={check.probes} data={data} />
      </CheckInsight>
    </div>
  );
};

const SimpleHTMLTable = ({ checkProbes, data }: { checkProbes: number[]; data: Record<string, number> }) => {
  const { data: probes = [] } = useProbes();
  const { timePointsInRange } = useCheckDrilldownInfo();
  const filteredProbes = probes.filter((probe) => probe.id && checkProbes.includes(probe.id));
  const styles = useStyles2(getStyles);

  const tableData = useMemo(() => {
    return filteredProbes.map((probe) => {
      const probeResults = data[probe.name];
      const executionPercentage = (probeResults / timePointsInRange) * 100;

      return {
        probe,
        executionPercentage,
        probeResults,
        timePointsInRange,
      };
    });
  }, [filteredProbes, data, timePointsInRange]);

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
        {tableData
          .sort((a, b) => b.executionPercentage - a.executionPercentage)
          .map((d) => (
            <ProbeRow key={d.probe.id} {...d} />
          ))}
      </tbody>
    </table>
  );
};

const ProbeRow = ({
  probe,
  executionPercentage,
  probeResults,
  timePointsInRange,
}: {
  probe: Probe;
  executionPercentage: number;
  probeResults: number;
  timePointsInRange: number;
}) => {
  const toDisplay = executionPercentage
    ? `${executionPercentage.toFixed(2)}% (${probeResults} / ${timePointsInRange})`
    : 'N/A';

  return (
    <tr>
      <td>{probe.name}</td>
      <td>{toDisplay}</td>
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
