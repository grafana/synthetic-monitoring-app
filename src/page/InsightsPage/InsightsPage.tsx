import React from 'react';
import { Alert, LoadingPlaceholder, Stack } from '@grafana/ui';

import { useChecks } from 'data/useChecks';
import { useInsights } from 'data/useInsights';
import { useProbes } from 'data/useProbes';

import { useInsightsAssistantContext } from './InsightsPage.hooks';
import { AlertingSection } from './AlertingSection';
import { UsageSection } from './UsageSection';
import { PerformanceSection } from './PerformanceSection';
import { RecommendationsSection } from './RecommendationsSection';

export function InsightsPage() {
  const { data, isLoading, error, refetch } = useInsights();
  const { data: checks = [] } = useChecks();
  const { data: probes = [] } = useProbes();

  const probeNamesById = React.useMemo(() => {
    const map = new Map<number, string>();
    for (const probe of probes) {
      if (probe.id) {
        map.set(probe.id, probe.name);
      }
    }
    return map;
  }, [probes]);

  const checkProbeNames = React.useMemo(() => {
    const map = new Map<number, string[]>();
    for (const check of checks) {
      if (check.id) {
        map.set(check.id, check.probes.map((pid) => probeNamesById.get(pid) ?? `Probe ${pid}`));
      }
    }
    return map;
  }, [checks, probeNamesById]);

  const unlabeledChecks = React.useMemo(
    () => checks.filter((c) => !c.labels || c.labels.length === 0),
    [checks]
  );

  useInsightsAssistantContext(data);

  if (isLoading) {
    return <LoadingPlaceholder text="Loading insights..." />;
  }

  if (error) {
    return (
      <Alert title="Failed to load insights." severity="warning" buttonContent="Retry" onRemove={() => refetch()} />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Stack direction="column" gap={2}>
      <UsageSection data={data} unlabeledChecks={unlabeledChecks} checkProbeNames={checkProbeNames} />
      <AlertingSection data={data} allChecks={checks} />
      <PerformanceSection data={data} />
      <RecommendationsSection data={data} allChecks={checks} />
    </Stack>
  );
}
