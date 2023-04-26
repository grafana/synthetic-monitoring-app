import React from 'react';
import { LinkedDatasourceInfo } from 'datasource/types';
import { Spinner } from '@grafana/ui';
import { useNavigation } from 'hooks/useNavigation';
import { ROUTES } from 'types';
import { findLinkedDatasource } from 'utils';

interface Props {
  info: LinkedDatasourceInfo;
}

const LinkedDatasourceView = ({ info }: Props) => {
  const navigate = useNavigation();
  const datasource = findLinkedDatasource(info);

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
