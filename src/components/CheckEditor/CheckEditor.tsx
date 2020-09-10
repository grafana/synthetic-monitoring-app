import React, { PureComponent, FC, useState, useContext, useEffect, useCallback } from 'react';
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
  Alert,
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Check, Label as SMLabel, CheckType, Probe, OrgRole, APIError, OnUpdateSettingsArgs } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { hasRole, checkType, defaultSettings } from 'utils';
import * as Validation from 'validation';
import CheckTarget from 'components/CheckTarget';
import { Subheader } from 'components/Subheader';
import { CheckSettings } from './CheckSettings';
import { ProbeOptions, OnChangeArgs } from './ProbeOptions';
import { useForm, FormContext, Controller } from 'react-hook-form';

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
const CHECK_TYPE_OPTIONS = [
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

export const CheckEditor: FC<Props> = ({ check, instance, onReturn }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState();

  const defaultCheckType = checkType(check.settings);

  const defaultValues = {
    checkType: CHECK_TYPE_OPTIONS.find(checkTypeOption => checkTypeOption.value === defaultCheckType),
    job: check.job,
    target: check.target,
    timeout: check.timeout / 1000,
    frequency: check.frequency / 1000,
    labels: check.labels,
    probes: check.probes,
    settings: check.settings,
  };

  const formMethods = useForm({ defaultValues });

  let isEditor = hasRole(OrgRole.EDITOR);

  const onSubmit = async (values: any) => {
    console.log(values);
    return;
    try {
      if (values.id) {
        await instance.updateCheck(values);
      } else {
        await instance.addCheck(values);
      }
      onReturn(true);
    } catch (e) {
      // this.setState({
      //   error: {
      //     status: e.status,
      //     message: e.data?.message ?? 'Something went wrong',
      //   },
      // });
    }
  };

  const onRemoveCheck = async () => {
    const id = check.id;
    if (!id) {
      return;
    }
    await instance.deleteCheck(id);
    onReturn(true);
  };

  const onBack = () => onReturn(true);

  const target = formMethods.watch('target', '') as string;
  const selectedCheckType = formMethods.watch('checkType').value as CheckType;

  if (!check) {
    return <div>Loading...</div>;
  }

  return (
    <FormContext {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)}>
        <Legend>{check.id ? 'Add Check' : 'Edit Check'}</Legend>
        <div
          className={css`
            margin-bottom: 8px;
          `}
        >
          <Subheader>Check Details</Subheader>
          <HorizontalGroup justify="flex-start" spacing="md">
            <Field label="Check Type" disabled={check.id ? true : false}>
              <Controller
                name="checkType"
                control={formMethods.control}
                as={Select}
                options={CHECK_TYPE_OPTIONS}
                width={30}
              />
            </Field>
            <Field label="Enabled" disabled={!isEditor}>
              <Container padding="sm">
                <Switch name="enabled" ref={formMethods.register()} disabled={!isEditor} />
              </Container>
            </Field>
          </HorizontalGroup>
          <Field
            label="Job Name"
            description="Name used for job label"
            disabled={!isEditor}
            // invalid={!Validation.validateJob(check.job)}
          >
            <Input ref={formMethods.register()} name="job" type="string" placeholder="jobName" />
          </Field>

          <Controller
            name="target"
            as={CheckTarget}
            control={formMethods.control}
            target={target}
            valueName="target"
            typeOfCheck={selectedCheckType}
            checkSettings={check.settings}
            disabled={!isEditor}
          />
          <hr
            className={css`
              margin-top: 24px;
            `}
          />
          <ProbeOptions isEditor={isEditor} timeout={check.timeout} frequency={check.frequency} probes={check.probes} />
          <CheckSettings
            labels={check.labels}
            settings={check.settings}
            typeOfCheck={selectedCheckType}
            isEditor={isEditor}
          />
        </div>
        <HorizontalGroup>
          <Button type="submit">Save {Validation.validateCheck(check)}</Button>
          {check.id && (
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)} disabled={!isEditor}>
              Delete Check
            </Button>
          )}
          <ConfirmModal
            isOpen={showDeleteModal}
            title="Delete check"
            body="Are you sure you want to delete this check?"
            confirmText="Delete check"
            onConfirm={onRemoveCheck}
            onDismiss={() => setShowDeleteModal(false)}
          />
          <a onClick={onBack}>Back</a>
        </HorizontalGroup>
        {error && (
          <div
            className={css`
              margin-top: 1rem;
            `}
          >
            <Alert title="Save failed" severity="error">
              {`${error?.status}: ${error?.message}`}
            </Alert>
          </div>
        )}
      </form>
    </FormContext>
  );
};

export default class CheckEditor2 extends PureComponent<Props, State> {
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

  onSettingsUpdate = ({ settings, labels }: OnUpdateSettingsArgs) => {
    this.setState(state => {
      const check = state.check as Check;
      check.settings = settings;
      check.labels = labels ?? [];
      return { check };
    });
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

  onProbeOptionsChange = ({ timeout, frequency, probes }: OnChangeArgs) => {
    this.setState(state => ({
      check: {
        ...state.check,
        timeout,
        frequency,
        probes,
      },
    }));
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
    const { check, showDeleteModal, probesLoading, typeOfCheck, error } = this.state;
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
        <div
          className={css`
            margin-bottom: 8px;
          `}
        >
          <Subheader>Check Details</Subheader>
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
          <hr
            className={css`
              margin-top: 24px;
            `}
          />
          <ProbeOptions
            isEditor={isEditor}
            timeout={check.timeout}
            frequency={check.frequency}
            probes={check.probes}
            onChange={this.onProbeOptionsChange}
          />
          <CheckSettings
            labels={check.labels}
            settings={check.settings}
            typeOfCheck={typeOfCheck || CheckType.HTTP}
            onUpdate={this.onSettingsUpdate}
            isEditor={isEditor}
          />
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
