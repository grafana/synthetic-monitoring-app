import React, { useContext } from 'react';
import { Spinner } from '@grafana/ui';

import { ROUTES } from 'types';
import { findLinkedDatasource } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';

interface Props {
  type: 'loki' | 'prometheus';
}

export const LinkedDatasourceView = ({ type }: Props) => {
  const navigate = useNavigation();
  const { instance, meta } = useContext(InstanceContext);
  if (!instance.metrics || !instance.logs) {
    return <Spinner />;
  }

  const info = type === 'prometheus' ? instance.metrics : instance.logs;
  const hostedId = type === 'prometheus' ? meta?.jsonData?.metrics.hostedId : meta?.jsonData?.logs.hostedId;
  const datasource = findLinkedDatasource({
    grafanaName: info.name,
    hostedId: hostedId ?? 0,
    uid: info.uid,
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
