import React, { useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { SceneContextProvider, TimeRangePicker } from '@grafana/scenes-react';
import { Alert, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';
import { getCheckType } from 'utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { AddNewCheckButton } from 'components/AddNewCheckButton';
import { ChecksEmptyState } from 'components/ChecksEmptyState';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { AttentionList } from './components/AttentionList';
import { HomeFilters, HomeFiltersState } from './components/HomeFilters';
import { KpiStrip } from './components/KpiStrip';
import { ProbeHealthSection } from './components/ProbeHealthSection';
import { TrendCharts } from './components/TrendCharts';
import { useHomeStatus, useProbeHealth } from './Home.hooks';
import { matchesFilters } from './Home.utils';

const HomeContent = () => {
  const styles = useStyles2(getStyles);
  const metricsDS = useMetricsDS();
  const { checks, checkHealth, kpis, overallReachability, isMetricsLoading } = useHomeStatus();
  const { probes, offlineProbes, isLoading: isProbesLoading } = useProbeHealth();
  const [filters, setFilters] = useState<HomeFiltersState>({ searchTerm: '', checkTypes: [] });

  const availableTypes = useMemo(() => {
    const types = new Set<CheckType>(checks.map((check) => getCheckType(check.settings)));
    return Array.from(types).sort();
  }, [checks]);

  const filteredHealth = useMemo(() => {
    return checkHealth.filter((item) => matchesFilters(item, filters.searchTerm, filters.checkTypes));
  }, [checkHealth, filters]);

  if (checks.length === 0) {
    return <ChecksEmptyState className={styles.emptyState} />;
  }

  return (
    <Stack direction="column" gap={2}>
      {metricsDS && <HomeFilters availableTypes={availableTypes} filters={filters} onChange={setFilters} />}

      <KpiStrip
        kpis={kpis}
        overallReachability={overallReachability}
        offlineProbeCount={offlineProbes.length}
        totalProbeCount={probes.length}
        isMetricsLoading={isMetricsLoading}
      />

      {!metricsDS && (
        <Alert severity="warning" title="A metrics datasource is required to display check status" />
      )}

      {metricsDS && (
        <>
          <section>
            <Text element="h2" variant="h4">
              Needs attention
            </Text>
            <AttentionList checkHealth={filteredHealth} isMetricsLoading={isMetricsLoading} />
          </section>

          <section>
            <Text element="h2" variant="h4">
              Probes
            </Text>
            <ProbeHealthSection probes={probes} offlineProbes={offlineProbes} isLoading={isProbesLoading} />
          </section>

          <section>
            <Text element="h2" variant="h4">
              Trends
            </Text>
            <TrendCharts />
          </section>
        </>
      )}
    </Stack>
  );
};

const HomePageActions = () => {
  const metricsDS = useMetricsDS();

  return (
    <Stack direction="row" gap={1} alignItems="center">
      {metricsDS && <TimeRangePicker />}
      <AddNewCheckButton source="homepage" />
    </Stack>
  );
};

export const HomePage = () => {
  return (
    <SceneContextProvider timeRange={{ from: 'now-3h', to: 'now' }} withQueryController>
      <PluginPage pageNav={{ text: 'Home' }} renderTitle={() => <h1>Home</h1>} actions={<HomePageActions />}>
        <QueryErrorBoundary>
          <HomeContent />
        </QueryErrorBoundary>
      </PluginPage>
    </SceneContextProvider>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  emptyState: css({
    width: '100%',
  }),
});
