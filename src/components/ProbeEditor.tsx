import React, { FC, useState, useReducer } from 'react';
import { css } from 'emotion';
import {
  Modal,
  Button,
  Container,
  ConfirmModal,
  Field,
  FieldSet,
  Input,
  HorizontalGroup,
  Switch,
  Legend,
  Form,
  InputControl,
} from '@grafana/ui';
import { Label as SMLabel, Probe, OrgRole, InputChangeEvent } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { hasRole } from 'utils';
import { SMLabelsForm } from './utils';
import ProbeStatus from './ProbeStatus';
import { validateLabel } from 'validation';

interface Props {
  probe: Probe;
  instance: SMDataSource;
  onReturn: (reload: boolean) => void;
}

interface Action {
  name: keyof Probe;
  value: string | SMLabel[];
}

interface ProbeValidationMessages {
  name?: string;
  latitude?: string;
  longitude?: string;
  region?: string;
  invalidState?: string;
}

const getValidationMessages = (probe: Probe): ProbeValidationMessages => {
  if (!probe) {
    return { invalidState: 'Something went wrong' };
  }
  const validationMessages: ProbeValidationMessages = {};
  if (probe.name.length > 32) {
    validationMessages.name = 'Must be less than 32 characters';
  }
  if (probe.latitude < -90 || probe.latitude > 90) {
    validationMessages.latitude = 'Must be between -90 and 90';
  }
  if (probe.longitude < -180 || probe.longitude > 180) {
    validationMessages.longitude = 'Must be between -180 and 180';
  }
  return validationMessages;
};

const isValid = (validations: ProbeValidationMessages, probe: Probe): boolean => {
  // invalid values
  const hasInvalidLabel = probe.labels.some(label => !validateLabel(label));
  if (Object.keys(validations).length > 0 || hasInvalidLabel) {
    return false;
  }

  // missing values
  if (!probe.name || !probe.latitude || !probe.longitude || !probe.region) {
    return false;
  }

  return true;
};

function probeReducer(state: Probe, action: Action) {
  const numberFields = new Set(['latitude', 'longitude']);
  const isNumber = numberFields.has(action.name);
  return {
    ...state,
    [action.name]: isNumber ? parseFloat(action.value as string) : action.value,
  };
}

const minInputWidth = css`
  min-width: 200px;
`;

const ProbeEditor: FC<Props> = ({ probe: initialProbe, instance, onReturn }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState('');
  const [probe, dispatchUpdateProbe] = useReducer(probeReducer, initialProbe);

  const onSave = async (formValues: Probe) => {
    console.log('formValues', formValues);
    formValues.latitude = Number(formValues.latitude);
    formValues.longitude = Number(formValues.longitude);
    if (!isValid(validations, formValues)) {
      console.log('not valid');
      return;
    }
    if (probe.id) {
      await instance.updateProbe(formValues);
      onReturn(true);
    } else {
      const info = await instance.addProbe(formValues);
      setShowTokenModal(true);
      setProbeToken(info.token);
    }
  };

  const onRemoveProbe = async () => {
    if (!probe.id) {
      return;
    }
    await instance.deleteProbe(probe.id);
    onReturn(true);
  };

  const onResetToken = async () => {
    const info = await instance.resetProbeToken(probe);
    setShowTokenModal(true);
    setProbeToken(info.token);
  };

  if (!probe) {
    return <div>Loading...</div>;
  }

  const validations = getValidationMessages(probe);

  const legend = probe.id ? 'Configuration' : 'Add Probe';

  const isEditor = !probe.public && hasRole(OrgRole.EDITOR);

  return (
    <HorizontalGroup align="flex-start">
      <Form onSubmit={onSave} validateOn="onBlur">
        {({ register, errors, control, formState, getValues }) => {
          console.log(getValues());
          return (
            <div>
              <Legend>{legend}</Legend>
              <FieldSet>
                <Field
                  error="Name is required"
                  invalid={Boolean(errors.name)}
                  label="Probe Name"
                  description="Unique name of probe"
                  disabled={!isEditor}
                  className={minInputWidth}
                  required
                >
                  <Input
                    type="text"
                    maxLength={32}
                    defaultValue={probe.name}
                    ref={register({
                      required: true,
                      maxLength: 32,
                    })}
                    id="probe-name-input"
                    placeholder="Probe name"
                    name="name"
                  />
                </Field>
                <Field label="Public" description="Public probes are run by Grafana Labs and can be used by all users">
                  <Container padding="sm">
                    <Switch ref={register()} name="public" disabled={!isEditor} />
                  </Container>
                </Field>
              </FieldSet>
              <FieldSet label="Location information">
                <Field
                  error="Must be between -90 and 90"
                  invalid={Boolean(errors.latitude)}
                  required
                  label="Latitude"
                  description="Latitude coordinates of this probe"
                  disabled={!isEditor}
                  className={minInputWidth}
                >
                  <Input
                    ref={register({
                      required: true,
                      max: 90,
                      min: -90,
                    })}
                    label="Latitude"
                    max={90}
                    min={-90}
                    defaultValue={probe.latitude}
                    id="probe-editor-latitude"
                    type="number"
                    placeholder="0.0"
                    name="latitude"
                  />
                </Field>
                <Field
                  error="Must be between -180 and 180"
                  invalid={Boolean(errors.longitude)}
                  required
                  label="Longitude"
                  description="Longitude coordinates of this probe"
                  disabled={!isEditor}
                >
                  <Input
                    ref={register({
                      required: true,
                      max: 180,
                      min: -180,
                    })}
                    label="Longitude"
                    name="longitude"
                    max={180}
                    min={-180}
                    defaultValue={probe.longitude}
                    id="probe-editor-longitude"
                    type="number"
                    placeholder="0.0"
                  />
                </Field>
              </FieldSet>
              <FieldSet>
                <Field
                  error="Region is required"
                  invalid={Boolean(errors.region)}
                  required
                  label="Region"
                  description="Region of this probe"
                  disabled={!isEditor}
                  className={minInputWidth}
                >
                  <Input
                    ref={register({ required: true })}
                    defaultValue={probe.region}
                    name="region"
                    label="Region"
                    type="string"
                    placeholder="Region"
                  />
                </Field>
              </FieldSet>
              <FieldSet label="Labels">
                <InputControl
                  control={control}
                  as={SMLabelsForm}
                  name="labels"
                  type="Labels"
                  labels={getValues().labels || probe.labels || []}
                  onUpdate={(labels: SMLabel[]) => {
                    control.setValue('labels', labels);
                  }}
                  isEditor={isEditor}
                  limit={3}
                />
              </FieldSet>
              <Container margin="md">
                <HorizontalGroup>
                  <Button type="submit" disabled={!isEditor || !formState.isValid || !formState.touched}>
                    Save
                  </Button>
                  {probe.id && (
                    <Button variant="destructive" onClick={() => setShowDeleteModal(true)} disabled={!isEditor}>
                      Delete Probe
                    </Button>
                  )}
                  <ConfirmModal
                    isOpen={showDeleteModal}
                    title="Delete Probe"
                    body="Are you sure you want to delete this Probe?"
                    confirmText="Delete Probe"
                    onConfirm={onRemoveProbe}
                    onDismiss={() => setShowDeleteModal(false)}
                  />
                  <Button variant="secondary" onClick={() => onReturn(false)}>
                    Back
                  </Button>
                </HorizontalGroup>
              </Container>
              <Modal
                isOpen={showTokenModal}
                title="Probe Authentication Token"
                icon={'lock'}
                onDismiss={() => (probe.id ? setShowTokenModal(false) : onReturn(false))}
              >
                {probeToken}
              </Modal>
            </div>
          );
        }}
      </Form>
      {probe.id && <ProbeStatus probe={probe} instance={instance} onResetToken={onResetToken} />}
    </HorizontalGroup>
  );
};

export default ProbeEditor;
