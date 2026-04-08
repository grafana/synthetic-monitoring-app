import React from 'react';
import { DisplayValue, GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  BigValue,
  BigValueColorMode,
  BigValueGraphMode,
  Container,
  LoadingBar,
  Spinner,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { useProbeExecutionStats } from 'data/useProbeExecutionStats';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { BigValueTitle } from 'components/BigValueTitle';
import { PROBE_CHECK_RUNS_TOOLTIP, PROBE_FAILED_CHECK_RUNS_TOOLTIP } from 'components/constants';

import { DataTestIds } from '../test/dataTestIds';

type ProbeCheckExecutionStatsProps = {
  probeName: string;
  /** Larger BigValues on probe detail page */
  variant?: 'card' | 'detail';
};

const CARD_DIMS = { height: 75, widthRuns: 140, widthFails: 148 };
const DETAIL_DIMS = { height: 90, widthRuns: 160, widthFails: 168 };

export function formatCheckRunsPerMinute(perSec: number | null): string {
  if (perSec === null || Number.isNaN(perSec)) {
    return '—';
  }

  const perMin = perSec * 60;

  if (perMin === 0) {
    return '0';
  }

  if (perMin >= 100) {
    return `${Math.round(perMin)}`;
  }

  if (perMin >= 1) {
    return perMin.toFixed(1);
  }

  return perMin.toFixed(2);
}

export function ProbeCheckExecutionStats({ probeName, variant = 'card' }: ProbeCheckExecutionStatsProps) {
  const metricsDS = useMetricsDS();
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const { executionsPerSec, failuresPerSec, isLoading, isFetching } = useProbeExecutionStats(probeName);

  const dims = variant === 'detail' ? DETAIL_DIMS : CARD_DIMS;
  const isDetail = variant === 'detail';

  if (!metricsDS) {
    return null;
  }

  const runsLabel = formatCheckRunsPerMinute(executionsPerSec);
  const failLabel = formatCheckRunsPerMinute(failuresPerSec);
  const failuresPerMin =
    failuresPerSec !== null && !Number.isNaN(failuresPerSec) ? failuresPerSec * 60 : null;
  const hasFailureActivity = failuresPerMin !== null && failuresPerMin > 0;

  const loading = isLoading;
  const fetching = isFetching && !isLoading;

  const runsDisplay: DisplayValue = {
    // @ts-expect-error BigValue title accepts React node in practice (see Gauge.tsx)
    title: <BigValueTitle title="Check runs / min" infoText={PROBE_CHECK_RUNS_TOOLTIP} />,
    // @ts-expect-error BigValue text accepts React node in practice
    text: loading ? <Spinner /> : runsLabel,
  };

  const failDisplay: DisplayValue = {
    // @ts-expect-error BigValue title accepts React node in practice
    title: <BigValueTitle title="Failed runs / min" infoText={PROBE_FAILED_CHECK_RUNS_TOOLTIP} />,
    // @ts-expect-error BigValue text accepts React node in practice
    text: loading ? <Spinner /> : failLabel,
    color: hasFailureActivity ? theme.colors.error.text : undefined,
  };

  return (
    <div
      className={cx(styles.stats, isDetail && styles.statsDetail)}
      data-testid={DataTestIds.ProbeCheckExecutionStats}
    >
      <div className={cx(styles.statItem, isDetail && styles.statItemDetail)}>
        <Container>
          <BigValue
            theme={config.theme2}
            colorMode={BigValueColorMode.Value}
            height={dims.height}
            width={dims.widthRuns}
            graphMode={BigValueGraphMode.Area}
            value={runsDisplay}
          />
          {loading || fetching ? <LoadingBar width={50} /> : <div className={styles.loadingSpacer} />}
        </Container>
      </div>
      <div className={cx(styles.statItem, isDetail && styles.statItemDetail)}>
        <Container>
          <BigValue
            theme={config.theme2}
            colorMode={BigValueColorMode.Value}
            height={dims.height}
            width={dims.widthFails}
            graphMode={BigValueGraphMode.Area}
            value={failDisplay}
          />
          {loading || fetching ? <LoadingBar width={50} /> : <div className={styles.loadingSpacer} />}
        </Container>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  stats: css({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  }),
  statsDetail: css({
    justifyContent: 'flex-start',
    marginTop: theme.spacing(2),
  }),
  statItem: css({
    display: 'flex',
    justifyContent: 'flex-end',
  }),
  statItemDetail: css({
    justifyContent: 'flex-start',
  }),
  loadingSpacer: css({
    height: 1,
  }),
});
