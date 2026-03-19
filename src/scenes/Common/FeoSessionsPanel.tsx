import React from 'react';

import { usePluginComponent } from '@grafana/runtime';
import { useTimeRange } from '@grafana/scenes-react';

import { useLogsDS } from 'hooks/useLogsDS';

export const FeoSessionsPanel = () => {
  const { component: SessionsComponent, isLoading } = usePluginComponent('grafana-kowalski-app/sessions-extension/v1');
  const [timeRange] = useTimeRange();
  const logsDS = useLogsDS();

  if (isLoading || !SessionsComponent) {
    return null;
  }

  return <SessionsComponent appId="95" timeRange={timeRange} logsDataSourceUID={logsDS?.uid} />;
};
