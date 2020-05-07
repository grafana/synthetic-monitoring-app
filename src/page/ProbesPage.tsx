// Libraries
import React, { PureComponent } from 'react';

// Types
import { GrafanaInstances, Label, Probe } from 'types';
import { Button, TextArea, HorizontalGroup } from '@grafana/ui';
import { getLocationSrv } from '@grafana/runtime';
//import ProbesMap from 'components/ProbesMap';

interface Props {
  instance: GrafanaInstances;
  id?: string;
}

interface State {
  probes: Probe[];
  probe?: Probe; // selected Probe
}

export class ProbesPage extends PureComponent<Props, State> {
  state: State = {
    probes: [],
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

  onSelectCheck = (id: number) => {
    getLocationSrv().update({
      partial: true,
      query: {
        id,
      },
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
    const { probe } = this.state;
    if (!instance) {
      return <div>Loading...</div>;
    }
    if (probe) {
      return (
        <div>
          <TextArea value={JSON.stringify(probe, null, 2)} rows={20} />
          <HorizontalGroup>
            <a onClick={this.onGoBack}>Back</a>
          </HorizontalGroup>
        </div>
      );
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
        {probes.map(probe => {
          return (
            <div key={probe.id} className="add-data-source-item" onClick={() => this.onSelectCheck(probe.id)}>
              <div className="add-data-source-item-text-wrapper">
                <span className="add-data-source-item-text">{probe.name}</span>
                <span className="add-data-source-item-desc">
                  <div>{this.labelsToString(probe.labels)}</div>
                  <div>Online: {probe.online ? 'yes' : 'no'}</div>
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
