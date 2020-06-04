import React, { PureComponent } from 'react';
import {
  Button,
  Container,
  ConfirmModal,
  Field,
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
import { hasRole, checkType } from 'utils';
import { PingSettingsForm } from './PingSettings';
import { HttpSettingsForm } from './HttpSettings';
import { FormLabel, WorldpingLabelsForm } from './utils';

interface TargetHelpInfo {
  text?: string;
  example: string;
}

interface Props {
  check: Check;
  instance: WorldPingDataSource;
  onReturn: (reload: boolean) => void;
}

interface State {
  check?: Check;
  typeOfCheck?: CheckType;
  probes: Probe[];
  showDeleteModal: boolean;
  targetHelp: TargetHelpInfo;
}

export class CheckEditor extends PureComponent<Props, State> {
  state: State = {
    showDeleteModal: false,
    probes: [],
    targetHelp: {
      example: '',
    },
  };

  async componentDidMount() {
    const { instance } = this.props;
    const check = { ...this.props.check } as Check;
    const probes = await instance.listProbes();
    const typeOfCheck = checkType(check.settings);
    const targetHelp = this.targetHelpText(typeOfCheck);
    this.setState({
      check,
      typeOfCheck,
      probes,
      targetHelp,
    });
  }

  showDeleteCheckModal = (show: boolean) => () => {
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
    let check = { ...this.state.check } as Check;
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

  onSetType = (type: SelectableValue<CheckType>) => {
    let check = { ...this.state.check } as Check;
    if (!type.value) {
      return;
    }
    let settings: Settings = {};
    settings[type.value] = undefined;
    check.settings = settings;

    const typeOfCheck = checkType(check.settings);
    const targetHelp = this.targetHelpText(typeOfCheck);
    this.setState({ check, targetHelp, typeOfCheck });
  };

  onJobUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    let check = { ...this.state.check } as Check;
    check.job = event.target.value;
    this.setState({ check });
  };

  onTargetUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    let check = { ...this.state.check } as Check;
    check.target = event.target.value;
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

  targetHelpText(typeOfCheck: CheckType | undefined): TargetHelpInfo {
    if (!typeOfCheck) {
      return { text: '', example: '' };
    }
    let resp: TargetHelpInfo;
    switch (typeOfCheck) {
      case CheckType.HTTP: {
        resp = {
          text: 'full url of endpoint to probe',
          example: 'https://google.com/',
        };
        break;
      }
      case CheckType.PING: {
        resp = {
          text: 'hostname of endpoint to ping',
          example: 'google.com',
        };
        break;
      }
      case CheckType.DNS: {
        resp = {
          text: 'name of record to query',
          example: 'google.com',
        };
        break;
      }
    }
    return resp;
  }

  render() {
    const { check, showDeleteModal, probes, targetHelp, typeOfCheck } = this.state;
    if (!check || probes.length === 0) {
      return <div>Loading...</div>;
    }

    let legend = 'Edit Check';
    if (!check.id) {
      legend = 'Add Check';
    }

    let isEditor = hasRole(OrgRole.EDITOR);

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
      <Container>
        <Legend>{legend}</Legend>
        <Container margin="md">
          <HorizontalGroup>
            <Field label={<FormLabel name="Check Type" />} disabled={check.id ? true : false}>
              <Select value={typeOfCheck} options={checkTypes} onChange={this.onSetType} />
            </Field>
            <Field
              label={
                <FormLabel
                  name="Job Name"
                  help="job name to assign to this check. 'Job name + target' must be unique."
                />
              }
              disabled={!isEditor}
            >
              <Input type="string" placeholder="job" value={check.job} onChange={this.onJobUpdate} />
            </Field>
            <Field label={<FormLabel name="Target" help={targetHelp.text} />} disabled={!isEditor}>
              <Input
                type="string"
                placeholder={targetHelp.example}
                value={check.target}
                onChange={this.onTargetUpdate}
                width={60}
              />
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
                max={600}
                min={10}
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
                max={60}
                min={1}
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
          <WorldpingLabelsForm labels={check.labels} onUpdate={this.onLabelsUpdate} isEditor={isEditor} />
        </Container>
        <Container margin="md">
          <h3 className="page-heading">Settings</h3>
          <CheckSettings
            settings={check.settings}
            typeOfCheck={typeOfCheck || CheckType.HTTP}
            onUpdate={this.onSettingsUpdate}
            isEditor={isEditor}
          />
        </Container>
        <Container margin="md">
          <HorizontalGroup>
            <Button onClick={this.onSave} disabled={!isEditor}>
              Save
            </Button>
            {check.id && (
              <Button variant="destructive" onClick={this.showDeleteCheckModal(true)} disabled={!isEditor}>
                Delete Check
              </Button>
            )}
            <ConfirmModal
              isOpen={showDeleteModal}
              title="Delete check"
              body="Are you sure you want to delete this check?"
              confirmText="Delete check"
              onConfirm={this.onRemoveCheck}
              onDismiss={this.showDeleteCheckModal(false)}
            />
            <a onClick={this.onBack}>Back</a>
          </HorizontalGroup>
        </Container>
      </Container>
    );
  }
}

interface CheckSettingsProps {
  isEditor: boolean;
  settings: Settings;
  typeOfCheck: CheckType;
  onUpdate: (settings: Settings) => void;
}

interface CheckSettingsState {
  settings?: Settings;
}

export class CheckSettings extends PureComponent<CheckSettingsProps, CheckSettingsState> {
  state: CheckSettingsState = {};

  componentDidMount() {
    const { settings } = this.props;
    this.setState({ settings });
  }

  componentDidUpdate(oldProps: CheckSettingsProps) {
    const { settings, typeOfCheck } = this.props;
    if (typeOfCheck !== oldProps.typeOfCheck) {
      this.setState({ settings });
    }
  }

  onUpdate = () => {
    this.props.onUpdate(this.state.settings!);
  };

  onJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    let settings: Settings = {};
    settings[this.props.typeOfCheck] = JSON.parse(event.target.value);
    this.setState({ settings: settings }, this.onUpdate);
  };

  onSettingsChange = (settings: Settings) => {
    this.setState({ settings: settings }, this.onUpdate);
  };

  render() {
    const { settings } = this.state;
    if (!settings) {
      return <div>Loading....</div>;
    }
    const { isEditor } = this.props;

    switch (this.props.typeOfCheck) {
      case CheckType.PING: {
        return <PingSettingsForm settings={settings} onUpdate={this.onSettingsChange} isEditor={isEditor} />;
      }
      case CheckType.HTTP: {
        return <HttpSettingsForm settings={settings} onUpdate={this.onSettingsChange} isEditor={isEditor} />;
      }
      case CheckType.DNS: {
        return (
          <TextArea
            value={JSON.stringify(settings[this.props.typeOfCheck], null, 2)}
            onChange={this.onJsonChange}
            rows={20}
            disabled={!isEditor}
          />
        );
      }
    }
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
