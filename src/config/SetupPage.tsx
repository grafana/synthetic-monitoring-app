// Libraries
import React, { PureComponent } from 'react';

// Types
import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';
import { getDataSourceSrv, getLocationSrv } from '@grafana/runtime';
import { TenantSetup } from 'components/TenantSetup';
import { createNewWorldpingInstance, findWorldPingDataSources } from 'utils';
import { WorldPingDataSource } from 'datasource/DataSource';

interface Props extends PluginConfigPageProps<AppPluginMeta<GlobalSettings>> {}
interface State {
  instance?: WorldPingDataSource;
}

export class SetupPage extends PureComponent<Props> {
  state: State = {};

  async componentDidMount() {
    this.checkInstance();
  }

  async componentDidUpdate(oldProps: Props) {
    if (oldProps.query !== this.props.query) {
      this.checkInstance();
    }
  }

  async checkInstance() {
    let instance = this.props.query['instance'];
    if (instance) {
      try {
        const ds = (await getDataSourceSrv().get(instance)) as WorldPingDataSource;
        this.setState({ instance: ds });
        return; //
      } catch (err) {
        console.log('Setup Unknown instance?', err);
        alert('Unknown instance: ' + instance);
      }
    }

    // Find the existing instance
    const instances = findWorldPingDataSources();
    if (instances.length) {
      getLocationSrv().update({
        partial: true,
        query: {
          instance: instances[0].name,
        },
      });
      return;
    }

    // Create a new instance
    if (!instance) {
      console.log('Creating a new datasource');
      await createNewWorldpingInstance();
      console.log('Reload the windows (will redirect)');
      window.location.reload(); // force reload
    }
  }

  render() {
    const { instance } = this.state;
    if (!instance) {
      return <div>Loading...</div>;
    }

    return <TenantSetup instance={instance} />;
  }
}
