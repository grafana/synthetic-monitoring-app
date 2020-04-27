import React, { PureComponent, ChangeEvent } from 'react';
import { Button, TextArea, HorizontalGroup } from '@grafana/ui';
import { Check } from 'types';
import { WorldPingDataSource } from 'datasource/DataSource';

interface Props {
  check: Check;
  instance: WorldPingDataSource;
  onReturn: () => void;
}
interface State {
  json: string;
}

export class CheckEditor extends PureComponent<Props, State> {
  state: State = { json: '' };

  componentDidMount() {
    const { tenantId, id, created, ...rest } = this.props.check;
    this.setState({
      json: JSON.stringify(rest, null, 2),
    });
  }

  onJsonChanged = (event: ChangeEvent<any>) => {
    this.setState({
      json: event.target.value,
    });
  };

  onRemoveCheck = async () => {
    const id = this.props.check.id;
    const info = this.props.instance.deleteCheck(id);
    console.log('Remove Check', id, info);
    this.props.onReturn();
  };

  onSave = async () => {
    const { check, instance } = this.props;
    const json = JSON.parse(this.state.json) as Check;

    if (check.id) {
      console.log('UPDATE', json, check, instance);
      const info = await instance.updateCheck(json);
      console.log('got', info);
    } else {
      console.log('ADD', json);
      const info = await instance.addCheck(json);
      console.log('got', info);
    }
    this.props.onReturn();
  };

  render() {
    const { json } = this.state;
    return (
      <div>
        <TextArea onChange={this.onJsonChanged} value={json} rows={20} />
        <HorizontalGroup>
          <Button onClick={this.onSave}>Save</Button>
          {/* <DeleteButton onConfirm={this.onRemoveCheck} /> */}
          <a onClick={this.props.onReturn}>Back</a>
        </HorizontalGroup>
      </div>
    );
  }
}
