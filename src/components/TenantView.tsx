import React, { PureComponent } from 'react';
import { WorldpingOptions, LinkedDatsourceInfo } from 'datasource/types';
import { config, getLocationSrv } from '@grafana/runtime';
import { DataSourceInstanceSettings } from '@grafana/data';
import { Button } from '@grafana/ui';

interface Props {
  settings: WorldpingOptions;
  worldping?: string;
}

export class TenantView extends PureComponent<Props> {
  render() {
    const { settings, worldping } = this.props;
    if (!settings) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        {worldping && (
          <>
            <h2>Worldping</h2>
            <LinkedDatasourceView info={{ grafanaName: worldping, hostedId: 0 }} />
          </>
        )}
        <h2>Metrics</h2>
        <LinkedDatasourceView info={settings.metrics} />
        <h2>Logs</h2>
        <LinkedDatasourceView info={settings.logs} />
      </div>
    );
  }
}

interface Props2 {
  info: LinkedDatsourceInfo;
}
interface State2 {
  ds?: DataSourceInstanceSettings;
}

class LinkedDatasourceView extends PureComponent<Props2, State2> {
  state: State2 = {};

  componentDidMount() {
    const { info } = this.props;
    this.setState({
      ds: config.datasources[info.grafanaName],
    });
  }

  onClick = () => {
    const { ds } = this.state;
    if (ds?.type === 'worldping-datasource') {
      getLocationSrv().update({
        partial: false,
        path: `plugins/grafana-worldping-app/?page=setup&instance=${ds?.name}`,
      });
    } else {
      getLocationSrv().update({
        partial: false,
        path: `datasources/edit/${ds?.id}/`,
      });
    }
  };

  render() {
    const { ds } = this.state;
    if (!ds) {
      return <div>Loading...</div>;
    }

    return (
      <div className="add-data-source-item" onClick={this.onClick}>
        <img className="add-data-source-item-logo" src={ds.meta.info.logos.small} />
        <div className="add-data-source-item-text-wrapper">
          <span className="add-data-source-item-text">{ds.name}</span>
          <span className="add-data-source-item-desc">{ds.type}</span>
        </div>
        <div className="add-data-source-item-actions">
          <Button>Edit</Button>
        </div>
      </div>
    );
  }
}
