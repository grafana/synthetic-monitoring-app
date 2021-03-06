import React from 'react';
import { LinkedDatsourceInfo } from 'datasource/types';
import { config, getLocationSrv } from '@grafana/runtime';
import { Spinner } from '@grafana/ui';

interface Props {
  info: LinkedDatsourceInfo;
}

const LinkedDatasourceView = ({ info }: Props) => {
  const datasource = config.datasources[info.grafanaName];

  const handleClick = () => {
    if (datasource?.type === 'synthetic-monitoring-datasource') {
      getLocationSrv().update({
        partial: false,
        path: `a/grafana-synthetic-monitoring-app/`,
      });
    } else {
      getLocationSrv().update({
        partial: false,
        path: `datasources/edit/${datasource?.id}/`,
        query: {},
      });
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

export default LinkedDatasourceView;
