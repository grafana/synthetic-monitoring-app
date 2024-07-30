import React from 'react';

import { useCanWriteLogs, useCanWriteMetrics } from 'hooks/useDSPermission';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';

interface LinkedDatasourceViewProps {
  type: 'loki' | 'prometheus';
}

export const LinkedDatasourceView = ({ type }: LinkedDatasourceViewProps) => {
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();
  const canEditLogs = useCanWriteLogs();
  const canEditMetrics = useCanWriteMetrics();

  const canEditMap = {
    prometheus: canEditMetrics,
    loki: canEditLogs,
  };

  const dsMap = {
    prometheus: metricsDS,
    loki: logsDS,
  };

  const ds = dsMap[type];

  if (!ds) {
    return null;
  }

  const showHref = canEditMap[type];
  const Tag = showHref ? 'a' : 'div';

  return (
    <Tag className="add-data-source-item" href={showHref ? `datasources/edit/${ds.uid}/` : undefined}>
      <img className="add-data-source-item-logo" src={ds.meta.info.logos.small} alt="" />
      <div className="add-data-source-item-text-wrapper">
        <span className="add-data-source-item-text">{ds.name}</span>
        <span className="add-data-source-item-desc">{ds.type}</span>
      </div>
    </Tag>
  );
};
