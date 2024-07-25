import React from 'react';
import { Spinner } from '@grafana/ui';

import { findLinkedDatasource } from 'utils';
import { useCanReadMetrics, useCanWriteLogs } from 'hooks/useDSPermission';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';

interface LinkedDatasourceViewProps {
  type: 'loki' | 'prometheus';
}

export const LinkedDatasourceView = ({ type }: LinkedDatasourceViewProps) => {
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();
  const canEditLogs = useCanWriteLogs();
  const canEditMetrics = useCanReadMetrics();

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

  const datasource = findLinkedDatasource(ds.uid, ds.name);

  if (!datasource) {
    return <Spinner />;
  }

  const showHref = canEditMap[type];
  const Tag = showHref ? 'a' : 'div';

  return (
    <Tag className="add-data-source-item" href={showHref ? `datasources/edit/${datasource?.id}/` : undefined}>
      <img className="add-data-source-item-logo" src={datasource.meta.info.logos.small} alt="" />
      <div className="add-data-source-item-text-wrapper">
        <span className="add-data-source-item-text">{datasource.name}</span>
        <span className="add-data-source-item-desc">{datasource.type}</span>
      </div>
    </Tag>
  );
};
