import React from 'react';
import { Alert, Card, Tag } from '@grafana/ui';

import { useCanWriteLogs, useCanWriteMetrics, useCanWriteSM } from 'hooks/useDSPermission';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';

interface LinkedDatasourceViewProps {
  type: 'loki' | 'prometheus' | 'synthetic-monitoring-datasource';
}

export const LinkedDatasourceView = ({ type }: LinkedDatasourceViewProps) => {
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();
  const smDS = useSMDS();

  const canEditSM = useCanWriteSM();
  const canEditLogs = useCanWriteLogs();
  const canEditMetrics = useCanWriteMetrics();

  const canEditMap = {
    prometheus: canEditMetrics,
    loki: canEditLogs,
    'synthetic-monitoring-datasource': canEditSM,
  };

  const dsMap = {
    prometheus: metricsDS,
    loki: logsDS,
    'synthetic-monitoring-datasource': smDS,
  };

  const ds = dsMap[type];

  if (!ds) {
    return (
      <Alert title="Data source missing">
        &quot;{type}&quot; data source is missing. Please configure it in the data sources settings.
      </Alert>
    );
  }

  const showHref = canEditMap[type];

  return (
    <Card href={showHref ? `datasources/edit/${ds.uid}/` : undefined}>
      <Card.Heading>{ds.name}</Card.Heading>
      <Card.Figure>
        <img width={40} height={40} src={ds.meta.info.logos.small} alt="" />
      </Card.Figure>

      {type !== 'synthetic-monitoring-datasource' && (
        <Card.Tags>
          <Tag name="Linked" />
        </Card.Tags>
      )}

      <Card.Meta>{ds.type}</Card.Meta>
    </Card>
  );
};
