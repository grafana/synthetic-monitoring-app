import React, { PureComponent } from 'react';
import { SMOptions, LinkedDatsourceInfo } from 'datasource/types';
import { config, getLocationSrv } from '@grafana/runtime';
import { DataSourceInstanceSettings } from '@grafana/data';
import { Button, Container } from '@grafana/ui';

interface Props {
  settings: SMOptions;
}

export class TenantView extends PureComponent<Props> {
  render() {
    const { settings } = this.props;
    if (!settings) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <h2>Linked Data Sources</h2>
        <Container margin="sm">
          <LinkedDatasourceView info={settings.metrics} />
          <LinkedDatasourceView info={settings.logs} />
        </Container>
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
    if (ds?.type === 'synthetic-monitoring-datasource') {
      getLocationSrv().update({
        partial: false,
        path: `a/grafana-synthetic-monitoring-app/`,
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
