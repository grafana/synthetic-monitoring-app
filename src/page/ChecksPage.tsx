// Libraries
import React, { PureComponent } from 'react';

// Types
import { Check, GrafanaInstances, Label } from 'types';
import { getLocationSrv } from '@grafana/runtime';
import { Button } from '@grafana/ui';
import { CheckEditor } from 'components/CheckEditor';

interface Props {
  instance: GrafanaInstances;
  id?: string;
}
interface State {
  checks: Check[];
  check?: Check; // selected check
}

export class ChecksPage extends PureComponent<Props, State> {
  state: State = {
    checks: [],
  };

  async componentDidMount() {
    const { instance, id } = this.props;
    const checks = await instance.worldping.listChecks();

    const num = id ? parseInt(id, 10) : -1;
    const check = checks.find(c => c.id === num);
    this.setState({ checks, check });
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

  onSelectCheck = (id: number) => {
    getLocationSrv().update({
      partial: true,
      query: {
        id,
      },
    });
  };

  labelsToString(labels: Label[]) {
    return labels
      .map(label => {
        return label.name + '=' + label.value;
      })
      .join(' ');
  }

  renderCheckList() {
    const { instance } = this.props;
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
          name: 'environment',
          value: 'production',
        },
      ],
      probes: [2, 3],
      settings: {
        ping: {
          hostname: 'apple.com',
          ipVersion: 'V4',
          dontFragment: true,
        },
      },
    } as Check;

    const { worldping } = instance;

    return (
      <div>
        {checks.map(check => {
          const checkType = Object.keys(check.settings)[0];
          return (
            <div key={check.id} className="add-data-source-item" onClick={() => this.onSelectCheck(check.id)}>
              <div className="add-data-source-item-text-wrapper">
                <span className="add-data-source-item-text">{check.id}</span>
                <span className="add-data-source-item-desc">
                  {checkType}: {this.labelsToString(check.labels)}
                </span>
              </div>
              <div className="add-data-source-item-actions">
                <Button>Select</Button>
              </div>
            </div>
          );
        })}
        <br />
        <h3>Add Check</h3>
        <CheckEditor check={template} instance={worldping} onReturn={this.onRefresh} />
      </div>
    );
  }

  onRefresh = async () => {
    const { instance } = this.props;
    const checks = await instance.worldping.listChecks();
    this.setState({
      checks,
    });
  };

  onGoBack = () => {
    console.log('go back');
    getLocationSrv().update({
      partial: true,
      query: {
        id: '',
      },
    });
  };

  render() {
    const { instance } = this.props;
    const { check } = this.state;
    if (!instance) {
      return <div>Loading...</div>;
    }
    if (check) {
      return <CheckEditor check={check} instance={instance.worldping} onReturn={this.onGoBack} />;
    }
    return <div>{this.renderCheckList()}</div>;
  }
}
