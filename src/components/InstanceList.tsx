import React, { PureComponent } from 'react';
import { Button, LinkButton } from '@grafana/ui';
import { HostedInstance } from 'types';
import { css } from 'emotion';

interface Props {
  selected: number;
  instances: HostedInstance[];
  onSelected: (id: number) => void;
}

export class InstanceList extends PureComponent<Props> {
  render() {
    const { selected } = this.props;
    return (
      <div>
        {this.props.instances.map(instance => {
          const isSelected = selected === instance.id;
          let logo = 'public/app/plugins/datasource/prometheus/img/prometheus_logo.svg';
          let hostedType = 'metrics';
          if (instance.type === 'logs') {
            logo = 'public/app/plugins/datasource/loki/img/loki_icon.svg';
            hostedType = 'logs';
          }

          let className = 'add-data-source-item';
          if (isSelected) {
            // 1px solid $blue-light;
            className += ' ' + css(`border:1px solid #5794f2`);
          }

          return (
            <div key={instance.id} className={className} onClick={() => this.props.onSelected(instance.id)}>
              <img className="add-data-source-item-logo" src={logo} />
              <div className="add-data-source-item-text-wrapper">
                <span className="add-data-source-item-text">{instance.name}</span>
                <span className="add-data-source-item-desc">description here....</span>
              </div>
              <div className="add-data-source-item-actions">
                <LinkButton
                  variant="secondary"
                  href={`https://grafana.com/orgs/${instance.orgSlug}/hosted-${hostedType}/${instance.id}?utm_source=worldping_app`}
                  target="_blank"
                  rel="noopener"
                  icon="external-link-alt"
                >
                  grafana.com
                </LinkButton>
                {!isSelected && <Button>Select</Button>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}
