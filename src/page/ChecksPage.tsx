// Libraries
import React, { PureComponent } from 'react';

// Types
import { Check } from 'types';
import { getLocationSrv } from '@grafana/runtime';
import { CheckEditor } from 'components/CheckEditor';
import { CheckList } from 'components/CheckList/CheckList';
import { InstanceContext } from 'contexts/InstanceContext';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { CheckInfoContextProvider } from 'components/CheckInfoContextProvider';
import { trackEvent } from 'analytics';

interface Props {
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
  static contextType = InstanceContext;
  declare context: React.ContextType<typeof InstanceContext>;

  state: State = {
    checks: [],
    addNew: false,
    loading: true,
  };

  async componentDidMount() {
    const { id } = this.props;
    const { instance } = this.context;
    const checks = (await instance.api?.listChecks()) ?? [];
    const num = id ? parseInt(id, 10) : -1;
    const check = checks?.find((c) => c.id === num);
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
      const check = this.state.checks?.find((c) => c.id === num);
      this.setState({ check });
    }
  }

  //-----------------------------------------------------------------
  // CHECK List
  //-----------------------------------------------------------------

  onAddNew = () => {
    trackEvent('viewAddNewCheck');
    this.setState({
      addNew: true,
    });
  };

  onRefresh = async () => {
    const { instance } = this.context;
    const checks = (await instance.api?.listChecks()) ?? [];
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

  renderPage() {
    const { check, addNew, loading, checks } = this.state;
    const { instance } = this.context;

    if (loading || !instance.api) {
      return <div>Loading...</div>;
    }
    if (check) {
      return <CheckEditor check={check} onReturn={this.onGoBack} />;
    }
    if (addNew) {
      return <CheckEditor onReturn={this.onGoBack} />;
    }
    return (
      <CheckList instance={instance} onAddNewClick={this.onAddNew} checks={checks} onCheckUpdate={this.onRefresh} />
    );
  }

  render() {
    const { checks } = this.state;
    return (
      <SuccessRateContextProvider checks={checks}>
        <CheckInfoContextProvider>{this.renderPage()}</CheckInfoContextProvider>
      </SuccessRateContextProvider>
    );
  }
}
