// Libraries
import React, { PureComponent } from 'react';

// Types
import { Label, Probe } from 'types';
import { getLocationSrv } from '@grafana/runtime';
import ProbeEditor from 'components/ProbeEditor';
import { InstanceContext } from 'components/InstanceContext';
import { ProbeList } from 'components/ProbeList';

interface Props {
  id?: string;
}

interface State {
  probes: Probe[];
  probe?: Probe; // selected Probe
  addNew: boolean;
}

export class ProbesPage2 extends PureComponent<Props, State> {
  static contextType = InstanceContext;

  state: State = {
    probes: [],
    addNew: false,
  };

  async componentDidMount() {
    const { id } = this.props;
    const { instance } = this.context;
    const probes = await instance.api.listProbes();
    const probeId = id ? parseInt(id, 10) : -1;
    const probe = probes.find((p: Probe) => p.id === probeId);
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
    const { instance } = this.context;
    const probes = await instance.api.listProbes();
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
    const { loading } = this.context;
    const { probe, addNew, probes } = this.state;
    if (loading) {
      return <div>Loading...</div>;
    }

    if (probe) {
      return <ProbeEditor probe={probe} onReturn={this.onGoBack} />;
    }
    if (addNew) {
      const template = {
        name: '',
        public: false,
        latitude: 0.0,
        longitude: 0.0,
        region: '',
        labels: [],
        online: false,
        onlineChange: 0,
      } as Probe;
      return <ProbeEditor probe={template} onReturn={this.onGoBack} />;
    }
    return <ProbeList probes={probes} onAddNew={this.onAddNew} onSelectProbe={this.onSelectProbe} />;
  }
}
