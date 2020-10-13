// Libraries
import React, { PureComponent } from 'react';

// Types
import { NavModelItem, AppRootProps, DataSourceInstanceSettings } from '@grafana/data';
import { GlobalSettings, RegistrationInfo, GrafanaInstances } from './types';
import { SMDataSource } from 'datasource/DataSource';
import { findSMDataSources, createNewApiInstance, dashboardUID } from 'utils';
import { SMOptions } from 'datasource/types';
import { config, getDataSourceSrv, getLocationSrv } from '@grafana/runtime';
import { TenantSetup } from './components/TenantSetup';
import { InstanceContext } from './components/InstanceContext';
import { ChecksPage } from 'page/ChecksPage';
import { ProbesPage } from 'page/ProbesPage';
import { WelcomePage } from 'page/WelcomePage';
import { Spinner } from '@grafana/ui';

interface Props extends AppRootProps<GlobalSettings> {}
interface State {
  settings: Array<DataSourceInstanceSettings<SMOptions>>;
  instances?: GrafanaInstances;
  loadingInstance: boolean;
  info?: RegistrationInfo;
  valid?: boolean;
}

export class RootPage extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      settings: findSMDataSources(),
      loadingInstance: true,
    };
  }

  async loadInstances() {
    const settings = this.state.settings[0];
    if (settings && settings.name) {
      const api = (await getDataSourceSrv().get(settings.name)) as SMDataSource;
      if (api) {
        let global = api.instanceSettings.jsonData;
        const instances: GrafanaInstances = {
          api,
          metrics: await loadDataSourceIfExists(global?.metrics?.grafanaName),
          logs: await loadDataSourceIfExists(global?.logs?.grafanaName),
        };

        this.setState({
          instances,
          loadingInstance: false,
          valid: isValid(instances),
        });
        this.updateNav();
        return;
      }
    }
    this.setState({ loadingInstance: false });
  }

  async componentDidMount() {
    this.loadInstances();
    // this.updateNav();
    // this.loadInstances();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.query !== prevProps.query) {
      if (this.props.query.page !== prevProps.query.page) {
        this.updateNav();
      }
    }
  }

  updateNav() {
    const { path, onNavChanged, query, meta } = this.props;
    const selected = query.page || 'checks';
    const tabs: NavModelItem[] = [];
    if (this.state.valid && selected !== 'config' && selected !== 'redirect') {
      tabs.push({
        text: 'Checks',
        url: path + '?page=checks',
        id: 'checks',
      });
      tabs.push({
        text: 'Probes',
        url: path + '?page=probes',
        id: 'probes',
      });
    } else if (this.state.valid && selected === 'redirect') {
      tabs.push({
        text: 'Dashboard Redirect',
        url: path + '?page=redirect',
        id: 'redirect',
      });
      tabs.push({
        text: 'Config',
        // icon: 'fa fa-fw fa-file-text-o',
        url: path,
        id: 'config',
      });
    } else {
      tabs.push({
        text: 'Config',
        // icon: 'fa fa-fw fa-file-text-o',
        url: path,
        id: 'config',
      });
    }

    // Set the active tab
    let found = false;

    for (const tab of tabs) {
      tab.active = !found && selected === tab.id;
      if (tab.active) {
        found = true;
      }
    }
    if (!found) {
      tabs[0].active = true;
    }

    const node = {
      text: 'Synthetic Monitoring',
      img: meta.info.logos.large,
      subTitle: 'Grafana Cloud Synthetic Monitoring',
      url: path,
      children: tabs,
    };

    // Update the page header
    onNavChanged({
      node: node,
      main: node,
    });
  }

  //-----------------------------------------------------------------------------------------
  // Multiple Config
  //-----------------------------------------------------------------------------------------
  renderMultipleConfigs() {
    return <div>TODO... multiple instances... delete one!!!!</div>;
  }

  dashboardRedirect() {
    const { query } = this.props;
    const { instances } = this.state;
    if (!query.dashboard) {
      return <div>Dashboard not found</div>;
    }
    const target = dashboardUID(query.dashboard, instances?.api);

    if (!target) {
      console.log('dashboard not found.', query);
      return <div>Dashboard not found</div>;
    }

    const d = `d/${target.uid}`;
    let q = { ...query };
    delete q.dashboard;
    delete q.page;
    getLocationSrv().update({
      partial: false,
      path: d,
      query: q,
    });
    return null;
  }

  //-----------------------------------------------------------------------------------------
  // Config
  //-----------------------------------------------------------------------------------------
  renderConfig() {
    const { instances } = this.state;
    if (!instances) {
      return <div>Loading.... (or maybe a user permissions error?)</div>;
    }

    return <TenantSetup instance={instances.api} />;
  }

  renderPage() {
    const { meta, query, ...rest } = this.props;
    const { settings, valid, instances, loadingInstance } = this.state;
    console.log(rest);
    console.log('hello', instances?.api);
    if (loadingInstance) {
      return <Spinner />;
    }
    if (
      !instances?.api ||
      !instances?.api?.instanceSettings?.jsonData?.initialized ||
      !instances?.api?.instanceSettings
    ) {
      return <WelcomePage meta={meta} />;
    }

    // if (settings.length > 1) {
    //   return this.renderMultipleConfigs();
    // }
    // const { } = this.props;
    // if (!valid || query.page === 'config') {
    // return this.renderConfig();
    // }

    if ('dashboard' in query) {
      return this.dashboardRedirect();
    }

    if (query.page === 'checks') {
      return <ChecksPage instance={instances} id={query.id} />;
    }
    if (query.page === 'probes') {
      return <ProbesPage id={query.id} />;
    }

    return <div>Page not found.</div>;
  }

  render() {
    const { instances, loadingInstance } = this.state;

    return (
      <InstanceContext.Provider value={{ instance: instances, loading: loadingInstance }}>
        {this.renderPage()}
      </InstanceContext.Provider>
    );
  }
}

async function loadDataSourceIfExists(name?: string) {
  if (name) {
    try {
      return await getDataSourceSrv().get();
    } catch {}
  }
  return undefined;
}

function isValid(instance: GrafanaInstances): boolean {
  if (!instance || !instance.logs || !instance.metrics || !instance.api) {
    return false;
  }
  return true;
}
