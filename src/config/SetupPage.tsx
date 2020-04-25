// Libraries
import React, { PureComponent } from 'react';

// Types
import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';
import { LinkButton, Button } from '@grafana/ui';

interface Props extends PluginConfigPageProps<AppPluginMeta<GlobalSettings>> {}

export class SetupPage extends PureComponent<Props> {
  constructor(props: Props) {
    super(props);
  }

  onClick = () => {
    console.log('CLICK!');
  };

  renderXXX() {
    return (
      <div className="add-data-source-item" onClick={this.onClick}>
        <img className="add-data-source-item-logo" src={'http://localhost:3000/public/app/plugins/datasource/prometheus/img/prometheus_logo.svg'} />
        <div className="add-data-source-item-text-wrapper">
          <span className="add-data-source-item-text">The Name</span>
          <span className="add-data-source-item-desc">description here....</span>
        </div>
        <div className="add-data-source-item-actions">
          <LinkButton variant="secondary" href={`?utm_source=grafana_add_ds`} target="_blank" rel="noopener" icon="external-link-alt">
            link text
          </LinkButton>
          <Button>Select</Button>
        </div>
      </div>
    );
  }

  render() {
    const { query } = this.props;

    return (
      <div>
        TODO... setup....
        <pre>{JSON.stringify(query)}</pre>
        11111111111111111111111111111111
        <div className="add-data-source-category">
          <div className="add-data-source-category__header">Header here</div>

          {this.renderXXX()}
          {this.renderXXX()}
        </div>
      </div>
    );
  }
}
