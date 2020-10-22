import React, { FC } from 'react';
import { LinkedDatsourceInfo } from 'datasource/types';
import { config, getLocationSrv } from '@grafana/runtime';
import { Button, Spinner } from '@grafana/ui';

interface Props {
  info: LinkedDatsourceInfo;
}

const LinkedDatasourceView: FC<Props> = ({ info }) => {
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
      <div className="add-data-source-item-actions">
        <Button>Edit</Button>
      </div>
    </div>
  );
};

export default LinkedDatasourceView;
