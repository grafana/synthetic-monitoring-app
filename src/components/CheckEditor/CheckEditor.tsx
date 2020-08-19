import React, { PureComponent } from 'react';
import { css } from 'emotion';
import {
  Button,
  Container,
  ConfirmModal,
  Field,
  Input,
  HorizontalGroup,
  Switch,
  Select,
  Legend,
  Collapse,
  Alert,
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Check, Label as SMLabel, Settings, CheckType, Probe, OrgRole, APIError } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { hasRole, checkType, defaultSettings } from 'utils';
import SMLabelsForm from 'components/SMLabelsForm';
import * as Validation from 'validation';
import CheckTarget from 'components/CheckTarget';
import CheckSettings from './CheckSettings';
import CheckProbes from './CheckProbes';

interface Props {
  check: Check;
  instance: SMDataSource;
  onReturn: (reload: boolean) => void;
}

interface State {
  check: Check;
  typeOfCheck?: CheckType;
  probes: Probe[];
  showDeleteModal: boolean;
  showOptions: boolean;
  probesLoading: boolean;
  error?: APIError;
}

export default class CheckEditor extends PureComponent<Props, State> {
  state: State = {
    showDeleteModal: false,
    check: { ...this.props.check },
    showOptions: false,
    probesLoading: true,
    probes: [],
  };

  async componentDidMount() {
    const { instance } = this.props;
    const { check } = this.state;
    const probes = await instance.listProbes();
    const typeOfCheck = checkType(check.settings);
    this.setState({
      typeOfCheck,
      probesLoading: false,
      probes,
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

  onLabelsUpdate = (labels: SMLabel[]) => {
    let check = { ...this.state.check } as Check;
    check.labels = labels;
    this.setState({ check });
  };

  onProbesUpdate = (probes: number[]) => {
    let check = { ...this.state.check } as Check;
    check.probes = probes;
    this.setState({ check });
  };

  onSettingsUpdate = (settings: Settings) => {
    let check = { ...this.state.check } as Check;
    check.settings = settings;
    this.setState({ check });
  };

  onSetType = (type: SelectableValue<CheckType>) => {
    let check = { ...this.state.check } as Check;
    if (!type.value) {
      return;
    }
    const typeOfCheck = type.value;
    const settings = defaultSettings(typeOfCheck);
    if (!settings) {
      return;
    }
    check.settings = settings;

    this.setState({ check, typeOfCheck });
  };

  onJobUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    let check = { ...this.state.check } as Check;
    check.job = event.target.value;
    this.setState({ check });
  };

  onTargetUpdate = (target: string) => {
    let check = { ...this.state.check } as Check;
    check.target = target;
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
    try {
      if (check.id) {
        await instance.updateCheck(check);
      } else {
        await instance.addCheck(check);
      }
      this.props.onReturn(true);
    } catch (e) {
      this.setState({
        error: {
          status: e.status,
          message: e.data?.message ?? 'Something went wrong',
        },
      });
    }
  };

  onEnableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let check = { ...this.state.check } as Check;
    check.enabled = !check.enabled;
    this.setState({ check });
  };

  onBack = () => {
    this.props.onReturn(false);
  };

  onToggleOptions = (isOpen: boolean) => {
    this.setState({ showOptions: !this.state.showOptions });
  };

  render() {
    const { check, showDeleteModal, probes, probesLoading, typeOfCheck, showOptions, error } = this.state;
    if (!check || probesLoading) {
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
      {
        label: 'TCP',
        value: CheckType.TCP,
      },
    ];

    return (
      <div>
        <Legend>{legend}</Legend>
        <div>
          <HorizontalGroup justify="flex-start" spacing="md">
            <Field label="Check Type" disabled={check.id ? true : false}>
              <Select value={typeOfCheck} options={checkTypes} onChange={this.onSetType} width={30} />
            </Field>
            <Field label="Enabled" disabled={!isEditor}>
              <Container padding="sm">
                <Switch value={check.enabled} onChange={this.onEnableChange} disabled={!isEditor} />
              </Container>
            </Field>
          </HorizontalGroup>
          <Field
            label="Job Name"
            description="Name used for job label"
            disabled={!isEditor}
            invalid={!Validation.validateJob(check.job)}
          >
            <Input type="string" placeholder="jobName" value={check.job} onChange={this.onJobUpdate} />
          </Field>
          <CheckTarget
            target={check.target}
            typeOfCheck={typeOfCheck}
            checkSettings={check.settings}
            disabled={!isEditor}
            onChange={this.onTargetUpdate}
          />
          <div>
            <Field
              label="Probe Locations"
              description="Select the locations where this target should be monitored from"
              disabled={!isEditor}
              invalid={!Validation.validateProbes(check.probes)}
            >
              <CheckProbes
                probes={check.probes}
                availableProbes={probes}
                onUpdate={this.onProbesUpdate}
                isEditor={isEditor}
              />
            </Field>
          </div>
          <Collapse label="Options" collapsible={true} onToggle={this.onToggleOptions} isOpen={showOptions}>
            <Field
              label="Frequency"
              description="How frequently the check should run."
              disabled={!isEditor}
              invalid={!Validation.validateFrequency(check.frequency)}
            >
              <Input
                label="Frequency"
                type="number"
                step={10}
                value={check!.frequency / 1000 || 60}
                onChange={this.onFrequencyUpdate}
                suffix="seconds"
                max={120}
                min={10}
                width={30}
              />
            </Field>
            <Field
              label="Timeout"
              description="Maximum execution time for a check"
              disabled={!isEditor}
              invalid={!Validation.validateTimeout(check.timeout)}
            >
              <Input
                label="Timeout"
                type="number"
                step={0.1}
                value={check!.timeout / 1000 || 5}
                onChange={this.onTimeoutUpdate}
                suffix="seconds"
                max={10}
                min={1}
                width={30}
              />
            </Field>

            <Field
              label="Labels"
              description="Custom labels to be included with collected metrics and logs."
              disabled={!isEditor}
              invalid={!Validation.validateLabels(check.labels)}
            >
              <SMLabelsForm
                labels={check.labels}
                onUpdate={this.onLabelsUpdate}
                isEditor={isEditor}
                type="Label"
                limit={5}
              />
            </Field>
            <br />
            <h3 className="page-heading">{typeOfCheck!.toLocaleUpperCase()} Settings</h3>
            <CheckSettings
              settings={check.settings}
              typeOfCheck={typeOfCheck || CheckType.HTTP}
              onUpdate={this.onSettingsUpdate}
              isEditor={isEditor}
            />
          </Collapse>
        </div>
        <HorizontalGroup>
          <Button onClick={this.onSave} disabled={!isEditor || !Validation.validateCheck(check)}>
            Save {Validation.validateCheck(check)}
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
        {error && (
          <div
            className={css`
              margin-top: 1rem;
            `}
          >
            <Alert title="Save failed" severity="error">
              {`${error.status}: ${error.message}`}
            </Alert>
          </div>
        )}
      </div>
    );
  }
}
