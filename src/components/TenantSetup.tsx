import React, { PureComponent } from 'react';
import { SMOptions } from 'datasource/types';
import { TenantView } from 'components/TenantView';
import { DashboardList } from './DashboardList';
import { InstanceContext } from './InstanceContext';

export class TenantSetup extends PureComponent {
  static contextType = InstanceContext;

  onOptionsChange = (options: SMOptions) => {
    const { instance } = this.context;
    return instance.api.onOptionsChange(options);
  };

  render() {
    const { instance } = this.context;
    if (!instance.api) {
      return null;
    }

    return (
      <div>
        <DashboardList
          options={instance.api.instanceSettings.jsonData}
          checkUpdates={true}
          onChange={this.onOptionsChange}
        />
        <br />
        <TenantView settings={instance.api.instanceSettings.jsonData} />
      </div>
    );
  }
}
