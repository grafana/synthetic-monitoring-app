import React, { FC, useState, useReducer } from 'react';
import { css } from 'emotion';
import { Modal, Button, Container, ConfirmModal, Field, Input, HorizontalGroup, Switch, Legend } from '@grafana/ui';
import { Label as SMLabel, Probe, OrgRole, InputChangeEvent } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { hasRole } from 'utils';
import { SMLabelsForm } from './utils';
import ProbeStatus from './ProbeStatus';

interface Props {
  probe: Probe;
  instance: SMDataSource;
  onReturn: (reload: boolean) => void;
}

interface Action {
  name: keyof Probe;
  value: string | SMLabel[];
}

interface LabelValidation {
  name?: string;
  value?: string;
}

interface ProbeValidation {
  name?: string;
  labels?: LabelValidation[];
  latitude?: string;
  longitude?: string;
  region?: string;
  invalidState?: string;
}

const getValidationMessages = (probe: Probe): ProbeValidation => {
  if (!probe) {
    return { invalidState: 'Something went wrong' };
  }
  const validations: ProbeValidation = {};
  if (probe.name.length > 32) {
    console.log('probe name must be less than 32 characters');
    validations.name = 'Must be less than 32 characters';
  }
  if (probe.latitude < -90 || probe.latitude > 90) {
    validations.latitude = 'Must be between -90 and 90';
  }
  if (probe.longitude < -180 || probe.longitude > 180) {
    validations.longitude = 'Must be between -180 and 180';
  }
  return validations;
  // for (const l of probe.labels) {
  //   if (l.name === '' || l.value === '') {
  //     console.log('label name and value must be set');
  //     return false;
  //   }
  //   if (!l.name.match(/^[a-zA-Z0-9_]*$/)) {
  //     console.log('label name can only contain a-zA-Z0-9_');
  //     return false;
  //   }
  //   if (l.name.length > 32) {
  //     console.log('label name must be less than 32 chars');
  //     return false;
  //   }
  //   if (l.value.length > 64) {
  //     console.log('label name must be less than 64 chars');
  //     return false;
  //   }
  // }
  // return true;
};

const isValid = (validations: ProbeValidation, probe: Probe): boolean => {
  console.log({ probe });
  if (Object.keys(validations).length > 0 || !probe.name || !probe.latitude || !probe.longitude || !probe.region) {
    console.log('in here');
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

  const onSave = async () => {
    if (!isValid(validations, probe)) {
      return;
    }
    if (probe.id) {
      console.log('UPDATE', probe, instance);
      const info = await instance.updateProbe(probe);
      console.log('got', info);
      onReturn(true);
    } else {
      console.log('ADD', probe);
      const info = await instance.addProbe(probe);
      setShowTokenModal(true);
      setProbeToken(info.token);
    }
  };

  const onRemoveProbe = async () => {
    if (!probe.id) {
      return;
    }
    const info = instance.deleteProbe(probe.id);
    console.log('Remove Probe', probe.id, info);
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
  console.log(validations);
  console.log(isValid(validations, probe));

  const legend = probe.id ? 'Configuration' : 'Add Probe';

  const isEditor = !probe.public && hasRole(OrgRole.EDITOR);

  return (
    <HorizontalGroup align="flex-start">
      <Container>
        <Legend>{legend}</Legend>
        <Container margin="md">
          <HorizontalGroup align="flex-start">
            <Field
              error={validations.name}
              invalid={Boolean(validations.name)}
              label="Probe Name"
              description="Unique name of probe"
              disabled={!isEditor}
              className={minInputWidth}
            >
              <Input
                type="string"
                required
                value={probe.name}
                onChange={(e: InputChangeEvent) => dispatchUpdateProbe({ name: 'name', value: e.target.value })}
              />
            </Field>
            <Field
              label="Public"
              description="Public probes are run by Grafana Labs and can be used by all users"
              disabled={!isEditor}
            >
              <Container padding="sm">
                <Switch value={probe.public} disabled={false} />
              </Container>
            </Field>
          </HorizontalGroup>
        </Container>
        <Container margin="md">
          <h3 className="page-heading">Location information</h3>
          <HorizontalGroup align="flex-start">
            <Field
              error={validations.latitude}
              invalid={Boolean(validations.latitude)}
              required
              label="Latitude"
              description="Latitude coordinates of this probe"
              disabled={!isEditor}
              className={minInputWidth}
            >
              <Input
                label="Latitude"
                type="number"
                placeholder="0.0"
                value={probe.latitude}
                onChange={(e: InputChangeEvent) => dispatchUpdateProbe({ name: 'latitude', value: e.target.value })}
              />
            </Field>
            <Field
              error={validations.longitude}
              invalid={Boolean(validations.longitude)}
              required
              label="Longitude"
              description="Longitude coordinates of this probe"
              disabled={!isEditor}
            >
              <Input
                label="Longitude"
                type="number"
                placeholder="0.0"
                value={probe.longitude}
                onChange={(e: InputChangeEvent) => dispatchUpdateProbe({ name: 'longitude', value: e.target.value })}
              />
            </Field>
          </HorizontalGroup>
          <HorizontalGroup>
            <Field
              error={validations.region}
              invalid={Boolean(validations.region)}
              required
              label="Region"
              description="Latitude coordinates of this probe"
              disabled={!isEditor}
              className={minInputWidth}
            >
              <Input
                label="Region"
                type="string"
                placeholder="region"
                value={probe.region}
                onChange={(e: InputChangeEvent) => dispatchUpdateProbe({ name: 'region', value: e.target.value })}
              />
            </Field>
          </HorizontalGroup>
        </Container>
        <Container margin="md">
          <h3 className="page-heading">Labels</h3>
          <SMLabelsForm
            labels={probe.labels}
            onUpdate={labels => {
              dispatchUpdateProbe({ name: 'labels', value: labels });
            }}
            isEditor={isEditor}
            type="Label"
            limit={3}
          />
        </Container>
        <Container margin="md">
          <HorizontalGroup>
            <Button onClick={() => onSave()} disabled={!isEditor || !isValid(validations, probe)}>
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
              onConfirm={() => onRemoveProbe}
              onDismiss={() => setShowDeleteModal(false)}
            />
            <a onClick={() => onReturn(false)}>Back</a>
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
      </Container>
      {probe.id && <ProbeStatus probe={probe} instance={instance} onResetToken={onResetToken} />}
    </HorizontalGroup>
  );
};

export default ProbeEditor;
