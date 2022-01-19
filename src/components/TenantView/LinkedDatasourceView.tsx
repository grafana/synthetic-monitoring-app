import React from 'react';
import { LinkedDatsourceInfo } from 'datasource/types';
import { config } from '@grafana/runtime';
import { Spinner } from '@grafana/ui';
import { useNavigation } from 'hooks/useNavigation';
import { ROUTES } from 'types';

interface Props {
  info: LinkedDatsourceInfo;
}

const LinkedDatasourceView = ({ info }: Props) => {
  const navigate = useNavigation();
  const datasource = config.datasources[info.grafanaName];

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

export default LinkedDatasourceView;
