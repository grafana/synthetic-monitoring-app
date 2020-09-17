// Libraries
import React, { PureComponent } from 'react';

// Types
import { Check, GrafanaInstances, IpVersion } from 'types';
import { getLocationSrv } from '@grafana/runtime';
import { CheckEditor } from 'components/CheckEditor';
import { CheckList } from 'components/CheckList';

interface Props {
  instance: GrafanaInstances;
  id?: string;
  checksPerPage?: number;
}

interface State {
  checks: Check[];
  check?: Check; // selected check
  addNew: boolean;
  loading: boolean;
}

export class ChecksPage extends PureComponent<Props, State> {
  state: State = {
    checks: [],
    addNew: false,
    loading: true,
  };

  async componentDidMount() {
    const { instance, id } = this.props;
    const checks = await instance.api.listChecks();
    const num = id ? parseInt(id, 10) : -1;
    const check = checks.find(c => c.id === num);
    this.setState({
      checks,
      check,
      loading: false,
    });
  }

  componentDidUpdate(oldProps: Props) {
    if (this.props.id !== oldProps.id) {
      const { id } = this.props;
      const num = id ? parseInt(id, 10) : -1;
      const check = this.state.checks.find(c => c.id === num);
      this.setState({ check });
    }
  }

  //-----------------------------------------------------------------
  // CHECK List
  //-----------------------------------------------------------------

  onAddNew = () => {
    this.setState({
      addNew: true,
    });
  };

  onRefresh = async () => {
    const { instance } = this.props;
    const checks = await instance.api.listChecks();
    this.setState({
      checks,
    });
  };

  onGoBack = (refresh: boolean) => {
    this.setState({
      addNew: false,
    });
    if (refresh) {
      this.onRefresh();
    }
    getLocationSrv().update({
      partial: true,
      query: {
        id: '',
      },
    });
  };

  render() {
    const { instance } = this.props;
    const { check, addNew, loading, checks } = this.state;
    if (loading) {
      return <div>Loading...</div>;
    }
    if (check) {
      return <CheckEditor check={check} instance={instance.api} onReturn={this.onGoBack} />;
    }
    if (addNew) {
      const template = {
        job: '',
        target: '',
        frequency: 60000,
        timeout: 3000,
        enabled: true,
        labels: [],
        probes: [],
        settings: {
          ping: {
            ipVersion: IpVersion.V4,
            dontFragment: false,
          },
        },
      } as Check;
      return <CheckEditor check={template} instance={instance.api} onReturn={this.onGoBack} />;
    }
    return <CheckList instance={instance} onAddNewClick={this.onAddNew} checks={checks} />;
  }
}
