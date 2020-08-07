import React, { FC, useState, useReducer } from 'react';
import {
  Badge,
  BadgeColor,
  Modal,
  Button,
  Container,
  ConfirmModal,
  Field,
  Input,
  HorizontalGroup,
  Switch,
  Legend,
  IconName,
} from '@grafana/ui';
import { Label as SMLabel, Probe, OrgRole, InputChangeEvent } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { hasRole } from 'utils';
import { SMLabelsForm } from './utils';
import { UptimeGauge } from './UptimeGauge';

interface ProbeStatusProps {
  probe: Probe;
  instance: SMDataSource;
  onResetToken: () => void;
}

const ProbeStatus: FC<ProbeStatusProps> = ({ probe, instance, onResetToken }) => {
  const [showResetModal, setShowResetModal] = useState(false);

  if (!probe) {
    return null;
  }
  let isEditor = !probe.public && hasRole(OrgRole.EDITOR);
  let onlineTxt = 'Offline';
  let onlineIcon = 'heart-break' as IconName;
  let color = 'red' as BadgeColor;
  if (probe.online) {
    onlineTxt = 'Online';
    onlineIcon = 'heart';
    color = 'green';
  }

  const handleResetToken = () => {
    onResetToken();
    setShowResetModal(false);
  };

  return (
    <Container margin="md">
      <Legend>
        Status: &nbsp;
        <Badge color={color} icon={onlineIcon} text={onlineTxt} />
      </Legend>
      {!probe.public && (
        <Container>
          <Button variant="destructive" onClick={() => setShowResetModal(true)} disabled={!isEditor}>
            Reset Access Token
          </Button>
          <ConfirmModal
            isOpen={showResetModal}
            title="Reset Probe Access Token"
            body="Are you sure you want to reset the access token for this Probe?"
            confirmText="Reset Token"
            onConfirm={() => handleResetToken()}
            onDismiss={() => setShowResetModal(false)}
          />
        </Container>
      )}
      <br />
      <UptimeGauge
        labelNames={['probe']}
        labelValues={[probe.name]}
        ds={instance.getMetricsDS()}
        height={200}
        width={300}
        sparkline={true}
      />
    </Container>
  );
};

interface Props {
  probe: Probe;
  instance: SMDataSource;
  onReturn: (reload: boolean) => void;
}

interface Action {
  name: keyof Probe;
  value: string | SMLabel[];
}

const isValid = (probe: Probe): boolean => {
  if (!probe) {
    return false;
  }
  if (probe.name === '') {
    console.log('probe name must be set');
    return false;
  }
  if (probe.name.length > 32) {
    console.log('probe name must be less than 32 characters');
    return false;
  }
  if (probe.latitude < -90 || probe.latitude > 90) {
    console.log('probe latitude must be between -90 and 90');
    return false;
  }
  if (probe.longitude < -180 || probe.longitude > 180) {
    console.log('probe longitude must be between -180 and 180');
    return false;
  }
  if (probe.region === '') {
    console.log('probe region must be set');
    return false;
  }
  if (probe.labels.length > 3) {
    console.log('probes cannot have more than 3 labels');
    return false;
  }
  for (const l of probe.labels) {
    if (l.name === '' || l.value === '') {
      console.log('label name and value must be set');
      return false;
    }
    if (!l.name.match(/^[a-zA-Z0-9_]*$/)) {
      console.log('label name can only contain a-zA-Z0-9_');
      return false;
    }
    if (l.name.length > 32) {
      console.log('label name must be less than 32 chars');
      return false;
    }
    if (l.value.length > 64) {
      console.log('label name must be less than 64 chars');
      return false;
    }
  }
  return true;
};

function probeReducer(state: Probe, action: Action) {
  return {
    ...state,
    [action.name]: action.value,
  };
}

const ProbeEditor: FC<Props> = ({ probe, instance, onReturn }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState('');
  const [probeValues, dispatchUpdateProbe] = useReducer(probeReducer, probe);

  const onSave = async () => {
    const isValid = false;
    if (!isValid) {
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

  const legend = probe.id ? 'Configuration' : 'Add Probe';

  const isEditor = !probe.public && hasRole(OrgRole.EDITOR);

  return (
    <HorizontalGroup align="flex-start">
      <Container>
        <Legend>{legend}</Legend>
        <Container margin="md">
          <HorizontalGroup>
            <Field label="Probe Name" description="Unique name of probe" disabled={!isEditor}>
              <Input
                type="string"
                value={probeValues.name}
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
          <HorizontalGroup>
            <Field label="Latitude" description="Latitude coordinates of this probe" disabled={!isEditor}>
              <Input
                label="Latitude"
                type="number"
                placeholder="0.0"
                value={probeValues.latitude}
                onChange={(e: InputChangeEvent) => dispatchUpdateProbe({ name: 'latitude', value: e.target.value })}
              />
            </Field>
            <Field label="Longitude" description="Longitude coordinates of this probe" disabled={!isEditor}>
              <Input
                label="Longitude"
                type="number"
                placeholder="0.0"
                value={probeValues.longitude}
                onChange={(e: InputChangeEvent) => dispatchUpdateProbe({ name: 'longitude', value: e.target.value })}
              />
            </Field>
          </HorizontalGroup>
          <HorizontalGroup>
            <Field label="Region" description="Latitude coordinates of this probe" disabled={!isEditor}>
              <Input
                label="Region"
                type="string"
                placeholder="region"
                value={probeValues.region}
                onChange={(e: InputChangeEvent) => dispatchUpdateProbe({ name: 'region', value: e.target.value })}
              />
            </Field>
          </HorizontalGroup>
        </Container>
        <Container margin="md">
          <h3 className="page-heading">Labels</h3>
          <SMLabelsForm
            labels={probeValues.labels}
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
            <Button onClick={onSave} disabled={!isEditor || !isValid(probeValues)}>
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
