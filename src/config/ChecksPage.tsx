// Libraries
import React, { PureComponent } from 'react';

// Types
import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';
import { GlobalSettings, Check } from 'types';
import { getDataSourceSrv, getLocationSrv } from '@grafana/runtime';
import { findWorldPingDataSources } from 'utils';
import { WorldPingDataSource } from 'datasource/DataSource';
import { Button } from '@grafana/ui';
import { CheckEditor } from 'components/CheckEditor';

interface Props extends PluginConfigPageProps<AppPluginMeta<GlobalSettings>> {}
interface State {
  instance: WorldPingDataSource;
  checks: Check[];
  check?: Check; // selected check
}

export class ChecksPage extends PureComponent<Props> {
  state: State = {
    instance: (undefined as unknown) as WorldPingDataSource,
    checks: [],
  };

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
        const checks = await ds.listChecks();
        let check: Check | undefined = undefined;
        if (this.props.query['check']) {
          const id = parseInt(this.props.query['check'], 10);
          check = checks.find(c => c.id === id);
        }
        this.setState({ instance: ds, checks, check });
        return; //
      } catch (err) {
        console.log('Unknown instance?', err);
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
      getLocationSrv().update({
        partial: false,
        path: 'plugins/grafana-worldping-app/',
        query: {
          page: 'setup',
        },
      });
    }
  }
  //-----------------------------------------------------------------
  // CHECK List
  //-----------------------------------------------------------------

  onSelectCheck = (id: number) => {
    getLocationSrv().update({
      partial: true,
      query: {
        check: id,
      },
    });
  };

  renderCheckList() {
    const { instance } = this.state;
    const { checks } = this.state;
    if (!checks) {
      return null;
    }

    const template = {
      frequency: 5000,
      offset: 1000,
      timeout: 2500,
      enabled: true,
      labels: [
        {
          Name: 'environment',
          Value: 'production',
        },
      ],
      probes: [2, 3],
      settings: {
        http: {
          url: 'https://apple.com/',
          method: 'GET',
          headers: null,
          body: '',
          downloadLimit: 0,
          ipVersion: 'V4',
          validateCert: true,
          validation: [
            {
              responseTime: {
                threshold: 250,
                severity: 'Warning',
              },
            },
          ],
        },
      },
    } as Check;

    return (
      <div>
        {checks.map(check => {
          return (
            <div key={check.id} className="add-data-source-item" onClick={() => this.onSelectCheck(check.id)}>
              <div className="add-data-source-item-text-wrapper">
                <span className="add-data-source-item-text">{check.id}</span>
                <span className="add-data-source-item-desc">description here....</span>
              </div>
              <div className="add-data-source-item-actions">
                <Button>Select</Button>
              </div>
            </div>
          );
        })}
        <br />
        <h3>Add Check</h3>
        <CheckEditor check={template} instance={instance} onReturn={this.onRefresh} />
      </div>
    );
  }

  onRefresh = async () => {
    const checks = await this.state.instance.listChecks();
    this.setState({
      checks,
    });
  };

  onGoBack = () => {
    console.log('go back');
    getLocationSrv().update({
      partial: true,
      query: {
        check: '',
      },
    });
  };

  render() {
    const { instance, check } = this.state;
    if (!instance) {
      return <div>Loading...</div>;
    }
    if (check) {
      return <CheckEditor check={check} instance={instance} onReturn={this.onGoBack} />;
    }
    return <div>{this.renderCheckList()}</div>;
  }
}
