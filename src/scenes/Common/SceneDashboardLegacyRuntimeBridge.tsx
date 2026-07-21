import React, { PropsWithChildren, useCallback, useMemo, useRef } from 'react';
import { useTimeRange, useVariables } from '@grafana/scenes-react';
import {
  DashboardLegacyRefreshProvider,
  DashboardLegacyVarsProvider,
} from 'dashboards/runtime/DashboardLegacyRuntime';
import { PanelTimeRangeProvider } from 'dashboards/runtime/PanelTimeRangeContext';

import { useSceneRefreshPicker } from 'scenes/Common/useSceneRefreshPicker';

function normalizeProbeValue(value: string[] | undefined): string[] {
  if (!value?.length || value.includes('$__all')) {
    return ['.*'];
  }

  return value;
}

export function SceneDashboardLegacyRuntimeBridge({ children }: PropsWithChildren) {
  const [timeRange] = useTimeRange();
  const vars = useVariables();
  const refreshCallbacksRef = useRef(new Set<() => void>());

  const notifyRefresh = useCallback(() => {
    refreshCallbacksRef.current.forEach((callback) => callback());
  }, []);

  const refreshState = useSceneRefreshPicker(notifyRefresh);

  const legacyVars = useMemo(() => {
    const probeVar = vars.find((variable) => variable.state.name === 'probe');
    const jobVar = vars.find((variable) => variable.state.name === 'job');
    const instanceVar = vars.find((variable) => variable.state.name === 'instance');

    return {
      // @ts-expect-error -- scene variable value is untyped
      probe: normalizeProbeValue(probeVar?.state.value as string[] | undefined),
      // @ts-expect-error -- scene variable value is untyped
      job: [(jobVar?.state.value as string | undefined) ?? ''],
      // @ts-expect-error -- scene variable value is untyped
      instance: [(instanceVar?.state.value as string | undefined) ?? ''],
    };
  }, [vars]);

  const legacyRefresh = useMemo(
    () => ({
      refresh: refreshState?.refresh,
      refreshInMs: refreshState?.refreshInMs,
      subscribeRefresh: (callback: () => void) => {
        refreshCallbacksRef.current.add(callback);

        return () => {
          refreshCallbacksRef.current.delete(callback);
        };
      },
    }),
    [refreshState?.refresh, refreshState?.refreshInMs]
  );

  return (
    <PanelTimeRangeProvider timeRange={timeRange}>
      <DashboardLegacyVarsProvider value={legacyVars}>
        <DashboardLegacyRefreshProvider value={legacyRefresh}>{children}</DashboardLegacyRefreshProvider>
      </DashboardLegacyVarsProvider>
    </PanelTimeRangeProvider>
  );
}
