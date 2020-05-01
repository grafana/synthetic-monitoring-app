// Libraries
import React, { PureComponent } from 'react';

// Types
import { GrafanaInstances, Probe } from 'types';
import ProbesMap from 'components/ProbesMap';

interface Props {
  instance: GrafanaInstances;
  id?: string;
}
interface State {
  probes: Probe[];
}

export class ProbesPage extends PureComponent<Props, State> {
  state: State = {
    probes: [],
  };

  async componentDidMount() {
    const { instance } = this.props;
    const probes = await instance.worldping.listProbes();
    this.setState({ probes });
  }

  render() {
    const { instance } = this.props;
    if (!instance) {
      return <div>Loading...</div>;
    }
    return (
      <div>
        <ProbesMap />
      </div>
    );
  }
}
