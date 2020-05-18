// Libraries
import React, { PureComponent } from 'react';

// Types
import { GrafanaInstances, Label, Probe, OrgRole } from 'types';
import { Button, HorizontalGroup, IconName, Badge, BadgeColor } from '@grafana/ui';
import { getLocationSrv } from '@grafana/runtime';
import { ProbeEditor } from 'components/ProbeEditor';
import { hasRole } from 'utils';
//import ProbesMap from 'components/ProbesMap';

interface Props {
  instance: GrafanaInstances;
  id?: string;
}

interface State {
  probes: Probe[];
  probe?: Probe; // selected Probe
  addNew: boolean;
}

export class ProbesPage extends PureComponent<Props, State> {
  state: State = {
    probes: [],
    addNew: false,
  };

  async componentDidMount() {
    const { instance, id } = this.props;
    const probes = await instance.worldping.listProbes();
    const num = id ? parseInt(id, 10) : -1;
    const probe = probes.find(p => p.id === num);
    this.setState({ probes, probe });
  }

  componentDidUpdate(oldProps: Props) {
    if (this.props.id !== oldProps.id) {
      const { id } = this.props;
      const num = id ? parseInt(id, 10) : -1;
      const probe = this.state.probes.find(p => p.id === num);
      this.setState({ probe });
    }
  }

  labelsToString(labels: Label[]) {
    return labels
      .map(label => {
        return label.name + '=' + label.value;
      })
      .join(' ');
  }

  onSelectProbe = (id: number) => {
    getLocationSrv().update({
      partial: true,
      query: {
        id,
      },
    });
  };

  onAddNew = () => {
    this.setState({
      addNew: true,
    });
  };

  onRefresh = async () => {
    const { instance } = this.props;
    const probes = await instance.worldping.listProbes();
    this.setState({
      probes,
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
    const { probe, addNew } = this.state;
    if (!instance) {
      return <div>Loading...</div>;
    }

    if (probe) {
      return <ProbeEditor probe={probe} instance={instance.worldping} onReturn={this.onGoBack} />;
    }
    if (addNew) {
      const template = {
        name: '',
        public: false,
        latitude: 0.0,
        longitude: 0.0,
        labels: [],
        online: false,
        onlineChange: 0,
      } as Probe;
      return <ProbeEditor probe={template} instance={instance.worldping} onReturn={this.onGoBack} />;
    }
    return <div>{this.renderProbeList()}</div>;
  }

  renderProbeList() {
    const { probes } = this.state;
    if (!probes) {
      return null;
    }
    return (
      <div>
        {hasRole(OrgRole.EDITOR) && (
          <HorizontalGroup justify="flex-end">
            <Button onClick={this.onAddNew}>New</Button>
          </HorizontalGroup>
        )}
        {probes.map(probe => {
          const probeId: number = probe.id || 0;
          if (!probe.id) {
            return;
          }
          let onlineTxt = 'Offline';
          let onlineIcon = 'heart-break' as IconName;
          let color = 'red' as BadgeColor;
          if (probe.online) {
            onlineTxt = 'Online';
            onlineIcon = 'heart';
            color = 'green';
          }
          return (
            <div key={probeId} className="add-data-source-item" onClick={() => this.onSelectProbe(probeId)}>
              <div className="add-data-source-item-text-wrapper">
                <span className="add-data-source-item-text">{probe.name}</span>
                <span className="add-data-source-item-desc">
                  <Badge color={color} icon={onlineIcon} text={onlineTxt} />
                  <div>{this.labelsToString(probe.labels)}</div>
                </span>
              </div>
              <div className="add-data-source-item-actions">
                <Button>Select</Button>
              </div>
            </div>
          );
        })}
        <br />
      </div>
    );
  }
}
