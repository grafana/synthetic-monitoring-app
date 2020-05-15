import React, { PureComponent } from 'react';
import {
  Button,
  Container,
  ConfirmModal,
  Field,
  List,
  IconButton,
  Input,
  HorizontalGroup,
  Switch,
  TextArea,
  MultiSelect,
  Select,
  Legend,
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Check, Label as WorldpingLabel, Settings, CheckType, Probe, OrgRole } from 'types';
import { WorldPingDataSource } from 'datasource/DataSource';
import { hasRole } from 'utils';
import { PingSettingsForm } from './pingSettings';
import { FormLabel } from './utils';

interface Props {
  check: Check;
  instance: WorldPingDataSource;
  onReturn: (reload: boolean) => void;
}

interface State {
  check?: Check;
  probes: Probe[];
  showDeleteModal: boolean;
}

export class CheckEditor extends PureComponent<Props, State> {
  state: State = { showDeleteModal: false, probes: [] };

  async componentDidMount() {
    const { instance } = this.props;
    const check = { ...this.props.check } as Check;
    const probes = await instance.listProbes();
    this.setState({
      check: check,
      probes: probes,
    });
  }

  showDeleteUserModal = (show: boolean) => () => {
    this.setState({ showDeleteModal: show });
  };

  onRemoveCheck = async () => {
    const id = this.props.check.id || 0;
    if (!this.props.check.id) {
      return;
    }
    const info = this.props.instance.deleteCheck(id);
    console.log('Remove Check', id, info);
    this.props.onReturn(true);
  };

  onLabelsUpdate = (labels: WorldpingLabel[]) => {
    let check = this.state.check;
    if (!check) {
      return;
    }
    check.labels = labels;
    this.setState({ check });
  };

  onProbesUpdate = (probes: number[]) => {
    let check = this.state.check;
    if (!check) {
      return;
    }
    check.probes = probes;
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
    check.frequency = event.target.valueAsNumber * 1000;
    this.setState({ check });
  };

  onTimeoutUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    let check = { ...this.state.check } as Check;
    check.timeout = event.target.valueAsNumber * 1000;
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
    this.props.onReturn(true);
  };

  onEnableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let check = { ...this.state.check } as Check;
    check.enabled = !check.enabled;
    this.setState({ check });
  };

  onBack = () => {
    this.props.onReturn(false);
  };

  render() {
    const { check, showDeleteModal, probes } = this.state;
    if (!check || probes.length === 0) {
      return <div>Loading...</div>;
    }
    let legend = 'Edit Check';
    if (!check.id) {
      legend = 'Add Check';
    }
    let isEditor = hasRole(OrgRole.EDITOR);

    return (
      <Container>
        <Legend>{legend}</Legend>
        <Container margin="md">
          <HorizontalGroup>
            <Field label={<FormLabel name="Check Name" help="Unique name of check" />} disabled={!isEditor}>
              <Input type="string" value="Grafana.com basic" />
            </Field>
            <Field label={<FormLabel name="Enabled" help="whether this check should run." />} disabled={!isEditor}>
              <Container padding="sm">
                <Switch value={check.enabled} onChange={this.onEnableChange} disabled={!isEditor} />
              </Container>
            </Field>
          </HorizontalGroup>
        </Container>
        <Container margin="md">
          <h3 className="page-heading">Timing information</h3>
          <HorizontalGroup>
            <Field
              label={<FormLabel name="Frequency" help="How frequently the check will run." />}
              disabled={!isEditor}
            >
              <Input
                label="Frequency"
                type="number"
                placeholder="60"
                value={check!.frequency / 1000 || 60}
                onChange={this.onFrequencyUpdate}
                suffix="seconds"
                maxLength={4}
              />
            </Field>
            <Field label={<FormLabel name="Timeout" help="maximum execution time for a check" />} disabled={!isEditor}>
              <Input
                label="Timeout"
                type="number"
                placeholder="5"
                value={check!.timeout / 1000 || 5}
                onChange={this.onTimeoutUpdate}
                suffix="seconds"
                maxLength={4}
              />
            </Field>
          </HorizontalGroup>
        </Container>
        <Container margin="md">
          <h3 className="page-heading">Probe Locations</h3>
          <CheckProbes
            probes={check.probes}
            availableProbes={probes}
            onUpdate={this.onProbesUpdate}
            isEditor={isEditor}
          />
        </Container>
        <Container margin="md">
          <h3 className="page-heading">Labels</h3>
          <CheckLabels labels={check.labels} onUpdate={this.onLabelsUpdate} isEditor={isEditor} />
        </Container>
        <Container margin="md">
          <h3 className="page-heading">Settings</h3>
          <CheckSettings
            settings={check.settings}
            onUpdate={this.onSettingsUpdate}
            isNew={check.id ? true : false}
            isEditor={isEditor}
          />
        </Container>
        <Container margin="md">
          <HorizontalGroup>
            <Button onClick={this.onSave} disabled={!isEditor}>
              Save
            </Button>
            {check.id && (
              <Button variant="destructive" onClick={this.showDeleteUserModal(true)} disabled={!isEditor}>
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
            <a onClick={this.onBack}>Back</a>
          </HorizontalGroup>
        </Container>
      </Container>
    );
  }
}

interface CheckLabelsProps {
  labels: WorldpingLabel[];
  isEditor: boolean;
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
    let labels = this.state.labels;
    console.log('adding new label', labels);
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
    const { isEditor } = this.props;
    return (
      <div>
        <HorizontalGroup>
          <List
            items={labels}
            getItemKey={item => {
              return item.name;
            }}
            renderItem={(item, index) => (
              <CheckLabel
                onDelete={this.onDelete}
                onChange={this.onChange}
                label={item}
                index={index}
                isEditor={isEditor}
              />
            )}
          />
        </HorizontalGroup>
        <IconButton name="plus-circle" onClick={this.addLabel} disabled={!isEditor} />
      </div>
    );
  }
}

interface CheckLabelProps {
  label: WorldpingLabel;
  index: number;
  isEditor: boolean;
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
    const { isEditor } = this.props;
    console.log('rendering label with name:', name);
    return (
      <HorizontalGroup>
        <Input type="text" placeholder="name" value={name} onChange={this.onNameChange} disabled={!isEditor} />
        <Input type="text" placeholder="value" value={value} onChange={this.onValueChange} disabled={!isEditor} />
        <IconButton name="minus-circle" onClick={this.onDelete} disabled={!isEditor} />
      </HorizontalGroup>
    );
  }
}

interface CheckSettingsProps {
  isNew: boolean;
  isEditor: boolean;
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

  onSetType = (type: SelectableValue<CheckType>) => {
    if (!type.value) {
      return;
    }
    let settings: Settings = {};
    settings[type.value] = undefined;
    this.setState({ type: type.value, settings: settings }, this.onUpdate);
  };

  onJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    let settings: Settings = {};
    settings[this.state.type] = JSON.parse(event.target.value);
    this.setState({ settings: settings }, this.onUpdate);
  };

  onSettingsChange = (settings: Settings) => {
    this.setState({ settings: settings }, this.onUpdate);
  };

  render() {
    const { settings, type } = this.state;
    const { isNew, isEditor } = this.props;
    let settingsForm = (
      <TextArea
        value={JSON.stringify(settings[type], null, 2)}
        onChange={this.onJsonChange}
        rows={20}
        disabled={!isEditor}
      />
    );
    if (type === CheckType.PING) {
      settingsForm = <PingSettingsForm settings={settings} onUpdate={this.onSettingsChange} isEditor={isEditor} />;
    }
    const checkTypes = [
      {
        label: 'HTTP',
        value: CheckType.HTTP,
      },
      {
        label: 'PING',
        value: CheckType.PING,
      },
      {
        label: 'DNS',
        value: CheckType.DNS,
      },
    ];
    return (
      <div>
        <HorizontalGroup>
          <Field label="Type" disabled={isNew}>
            <Select value={type} options={checkTypes} onChange={this.onSetType} />
          </Field>
        </HorizontalGroup>
        {settingsForm}
      </div>
    );
  }
}

interface CheckProbesProps {
  probes: number[];
  availableProbes: Probe[];
  isEditor: boolean;
  onUpdate: (probes: number[]) => void;
}

interface CheckProbesState {
  probes: number[];
  probeStr: string;
}

export class CheckProbes extends PureComponent<CheckProbesProps, CheckProbesState> {
  state = {
    probes: this.props.probes || [],
    probeStr: this.props.probes.join(','),
  };

  onChange = (item: Array<SelectableValue<number>>) => {
    let probes: number[] = [];
    for (const p of item.values()) {
      if (p.value) {
        probes.push(p.value);
      }
    }
    console.log('probes updated to:', probes);

    const str = probes.join(',');
    this.setState({ probes: probes, probeStr: str }, this.onUpdate);
  };

  onUpdate = () => {
    this.props.onUpdate(this.state.probes);
  };

  render() {
    const { probes } = this.state;
    const { availableProbes, isEditor } = this.props;
    let options = [];
    for (const p of availableProbes) {
      options.push({
        label: p.name,
        value: p.id,
        labels: p.labels,
        online: p.online,
      });
    }
    let selectedProbes = [];
    for (const p of probes) {
      let existing = options.find(item => item.value === p);
      if (existing) {
        selectedProbes.push(existing);
      }
    }

    return (
      <div>
        <MultiSelect options={options} value={selectedProbes} onChange={this.onChange} disabled={!isEditor} />
      </div>
    );
  }
}
