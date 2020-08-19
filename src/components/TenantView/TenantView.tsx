import React, { PureComponent } from 'react';
import { SMOptions } from 'datasource/types';
import { Container } from '@grafana/ui';
import LinkedDatasourceView from './LinkedDatasourceView';

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
