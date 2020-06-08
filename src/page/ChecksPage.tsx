// Libraries
import React, { PureComponent } from 'react';

// Types
import { Check, GrafanaInstances, Label, IpVersion, OrgRole } from 'types';
import { getLocationSrv } from '@grafana/runtime';
import { Button, HorizontalGroup } from '@grafana/ui';
import { CheckEditor } from 'components/CheckEditor';
import { hasRole } from 'utils';

interface Props {
  instance: GrafanaInstances;
  id?: string;
}
interface State {
  checks: Check[];
  check?: Check; // selected check
  addNew: boolean;
}

export class ChecksPage extends PureComponent<Props, State> {
  state: State = {
    checks: [],
    addNew: false,
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

  sortChecks(checks: Check[]): Check[] {
    return checks.sort((a, b) => b.job.localeCompare(a.job));
  }

  renderCheckList() {
    const { checks } = this.state;
    if (!checks) {
      return null;
    }

    const sortedChecks = this.sortChecks(checks);

    return (
      <div>
        {hasRole(OrgRole.EDITOR) && (
          <HorizontalGroup justify="flex-end">
            <Button onClick={this.onAddNew}>New</Button>
          </HorizontalGroup>
        )}

        {sortedChecks.map(check => {
          const checkId: number = check.id || 0;
          if (!check.id) {
            return;
          }
          const checkType = Object.keys(check.settings)[0];
          return (
            <div key={checkId} className="add-data-source-item" onClick={() => this.onSelectCheck(checkId)}>
              <div className="add-data-source-item-text-wrapper">
                <span className="add-data-source-item-text">
                  {check.job} / {check.target}
                </span>
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
      </div>
    );
  }

  onAddNew = () => {
    this.setState({
      addNew: true,
    });
  };

  onRefresh = async () => {
    const { instance } = this.props;
    const checks = await instance.worldping.listChecks();
    this.setState({
      checks,
    });
  };

  onGoBack = (refresh: boolean) => {
    console.log('go back');
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
    const { check, addNew } = this.state;
    if (!instance) {
      return <div>Loading...</div>;
    }
    if (check) {
      return <CheckEditor check={check} instance={instance.worldping} onReturn={this.onGoBack} />;
    }
    if (addNew) {
      const template = {
        job: 'worldping',
        target: '',
        frequency: 60000,
        timeout: 2500,
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
      return <CheckEditor check={template} instance={instance.worldping} onReturn={this.onGoBack} />;
    }
    return <div>{this.renderCheckList()}</div>;
  }
}
