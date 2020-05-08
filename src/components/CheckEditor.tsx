import React, { PureComponent } from 'react';
import { Button, ConfirmModal, Label, List, IconButton, Input, HorizontalGroup, TextArea } from '@grafana/ui';
import { Check, Label as WorldpingLabel, Settings, CheckType } from 'types';
import { WorldPingDataSource } from 'datasource/DataSource';

interface Props {
  check: Check;
  instance: WorldPingDataSource;
  onReturn: () => void;
}

interface State {
  check?: Check;
  showDeleteModal: boolean;
}

export class CheckEditor extends PureComponent<Props, State> {
  state: State = { showDeleteModal: false };

  componentDidMount() {
    const check = { ...this.props.check } as Check;
    this.setState({
      check: check,
    });
  }

  showDeleteUserModal = (show: boolean) => () => {
    this.setState({ showDeleteModal: show });
  };

  onRemoveCheck = async () => {
    const id = this.props.check.id;
    const info = this.props.instance.deleteCheck(id);
    console.log('Remove Check', id, info);
    this.props.onReturn();
  };

  onLabelsUpdate = (labels: WorldpingLabel[]) => {
    let check = this.state.check;
    if (!check) {
      return;
    }
    check.labels = labels;
    this.setState({ check });
  };

  onSettingsUpdate = (settings: Settings) => {
    let check = this.state.check;
    if (!check) {
      return;
    }
    check.settings = settings;
    this.setState({ check });
  };

  onFrequencyUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    let check = { ...this.state.check } as Check;
    check.frequency = Number(event.target.value) * 1000;
    this.setState({ check });
  };

  onTimeoutUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    let check = { ...this.state.check } as Check;
    check.timeout = Number(event.target.value) * 1000;
    this.setState({ check });
  };

  onSave = async () => {
    const { instance } = this.props;
    const { check } = this.state;
    if (!check) {
      return;
    }
    if (check.id) {
      console.log('UPDATE', check, instance);
      const info = await instance.updateCheck(check);
      console.log('got', info);
    } else {
      console.log('ADD', check);
      const info = await instance.addCheck(check);
      console.log('got', info);
    }
    this.props.onReturn();
  };

  render() {
    const { check, showDeleteModal } = this.state;
    if (!check) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <h3 className="page-heading">Timing information</h3>
        <HorizontalGroup>
          <Label>Frequency (s)</Label>
          <Input
            type="number"
            placeholder="60"
            value={check!.frequency / 1000 || 60}
            onChange={this.onFrequencyUpdate}
          />
          <Label>Timeout (s)</Label>
          <Input type="number" placeholder="5" value={check!.timeout / 1000 || 5} onChange={this.onTimeoutUpdate} />
        </HorizontalGroup>
        <h3 className="page-heading">Labels</h3>
        <CheckLabels labels={check.labels} onUpdate={this.onLabelsUpdate} />
        <br />
        <h3 className="page-heading">Settings</h3>
        <CheckSettings settings={check.settings} onUpdate={this.onSettingsUpdate} isNew={check.id ? true : false} />
        <br />
        <HorizontalGroup>
          <Button onClick={this.onSave}>Save</Button>
          {check.id && (
            <Button variant="destructive" onClick={this.showDeleteUserModal(true)}>
              Delete Check
            </Button>
          )}
          <ConfirmModal
            isOpen={showDeleteModal}
            title="Delete check"
            body="Are you sure you want to delete this check?"
            confirmText="Delete check"
            onConfirm={this.onRemoveCheck}
            onDismiss={this.showDeleteUserModal(false)}
          />
          <a onClick={this.props.onReturn}>Back</a>
        </HorizontalGroup>
        <br />
      </div>
    );
  }
}

interface CheckLabelsProps {
  labels: WorldpingLabel[];
  onUpdate: (labels: WorldpingLabel[]) => void;
}

interface CheckLabelsState {
  labels: WorldpingLabel[];
  numLabels: number;
}

export class CheckLabels extends PureComponent<CheckLabelsProps, CheckLabelsState> {
  state = {
    labels: this.props.labels || [],
    numLabels: this.props.labels.length,
  };

  addLabel = () => {
    console.log('adding new label');
    let labels = this.state.labels;
    const n = labels.push({ name: '', value: '' });

    this.setState({ labels: labels, numLabels: n }, this.onUpdate);
  };

  onDelete = (index: number) => {
    let labels = this.state.labels;
    labels.splice(index, 1);
    this.setState({ labels: labels, numLabels: labels.length }, this.onUpdate);
  };

  onUpdate = () => {
    this.props.onUpdate(this.state.labels);
  };

  onChange = (index: number, label: WorldpingLabel) => {
    let labels = this.state.labels;
    labels[index] = label;
    this.setState({ labels: labels }, this.onUpdate);
  };

  render() {
    const { labels } = this.state;
    return (
      <div>
        <HorizontalGroup>
          <List
            items={labels}
            getItemKey={item => {
              return item.name;
            }}
            renderItem={(item, index) => (
              <CheckLabel onDelete={this.onDelete} onChange={this.onChange} label={item} index={index} />
            )}
          />
        </HorizontalGroup>
        <IconButton name="plus-circle" onClick={this.addLabel} />
      </div>
    );
  }
}

interface CheckLabelProps {
  label: WorldpingLabel;
  index: number;
  onDelete: (index: number) => void;
  onChange: (index: number, label: WorldpingLabel) => void;
}

interface CheckLabelState {
  name: string;
  value: string;
}

export class CheckLabel extends PureComponent<CheckLabelProps, CheckLabelState> {
  state = {
    name: this.props.label.name || '',
    value: this.props.label.value || '',
  };

  onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ name: event.target.value }, this.onChange);
  };

  onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ value: event.target.value }, this.onChange);
  };

  onDelete = () => {
    this.props.onDelete(this.props.index);
  };

  onChange = () => {
    this.props.onChange(this.props.index, { name: this.state.name, value: this.state.value });
  };

  render() {
    const { name, value } = this.state;
    return (
      <HorizontalGroup>
        <Input type="text" placeholder="name" value={name} onChange={this.onNameChange} />
        <Input type="text" placeholder="value" value={value} onChange={this.onValueChange} />
        <IconButton name="minus-circle" onClick={this.onDelete} />
      </HorizontalGroup>
    );
  }
}

interface CheckSettingsProps {
  isNew: boolean;
  settings: Settings;
  onUpdate: (settings: Settings) => void;
}

interface CheckSettingsState {
  settings: Settings;
  type: CheckType;
}

export class CheckSettings extends PureComponent<CheckSettingsProps, CheckSettingsState> {
  state = {
    settings: this.props.settings || { http: {} },
    type: this.checkType(this.props.settings || { http: {} }),
  };

  checkType(settings: Settings) {
    let types = Object.keys(settings);
    if (types.length < 1) {
      return CheckType.HTTP;
    }
    return types[0] as CheckType;
  }

  onUpdate = () => {
    this.props.onUpdate(this.state.settings);
  };

  onSetType = (event: React.ChangeEvent<HTMLInputElement>) => {
    let settings: Settings = {};
    let type = event.target.value as CheckType;
    settings[type] = {};
    this.setState({ type: type, settings: settings }, this.onUpdate);
  };

  onSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const settings = JSON.parse(event.target.value);
    this.setState({ settings: settings }, this.onUpdate);
  };

  render() {
    const { settings, type } = this.state;
    const { isNew } = this.props;
    return (
      <div>
        <HorizontalGroup>
          <Label>Type</Label>
          <Input type="string" value={type} disabled={isNew} />
        </HorizontalGroup>
        <TextArea value={JSON.stringify(settings[type], null, 2)} onChange={this.onUpdate} rows={20} />
      </div>
    );
  }
}
