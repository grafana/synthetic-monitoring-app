import React from 'react';
import { Spinner } from '@grafana/ui';

import { ROUTES } from 'types';
import { findLinkedDatasource } from 'utils';
import { useLogsDS } from 'data/useLogsDS';
import { useMetricsDS } from 'data/useMetricsDS';
import { useMeta } from 'hooks/useMeta';
import { useNavigation } from 'hooks/useNavigation';

interface Props {
  type: 'loki' | 'prometheus';
}

export const LinkedDatasourceView = ({ type }: Props) => {
  const navigate = useNavigation();
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();
  const meta = useMeta();

  const dsMap = {
    prometheus: metricsDS,
    loki: logsDS,
  };

  const hostedIDMap = {
    prometheus: meta.jsonData?.metrics?.hostedId,
    loki: meta.jsonData?.logs?.hostedId,
  };

  const datasource = findLinkedDatasource({
    grafanaName: dsMap[type].name,
    hostedId: hostedIDMap[type] ?? 0,
    uid: dsMap[type].uid,
  });

  const handleClick = () => {
    if (datasource?.type === 'synthetic-monitoring-datasource') {
      navigate(ROUTES.Home);
    } else {
      navigate(`datasources/edit/${datasource?.id}/`, {}, true);
    }
  };

  if (!datasource) {
    return <Spinner />;
  }

  return (
    <div className="add-data-source-item" onClick={handleClick}>
      <img className="add-data-source-item-logo" src={datasource.meta.info.logos.small} />
      <div className="add-data-source-item-text-wrapper">
        <span className="add-data-source-item-text">{datasource.name}</span>
        <span className="add-data-source-item-desc">{datasource.type}</span>
      </div>
    </div>
  );
};
