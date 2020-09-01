import React, { FC, useState, useContext } from 'react';
import { css } from 'emotion';
import {
  Modal,
  Button,
  Container,
  ConfirmModal,
  Field,
  Input,
  HorizontalGroup,
  Switch,
  Legend,
  Form,
  InputControl,
} from '@grafana/ui';
import { Label as SMLabel, Probe, OrgRole } from 'types';
import { hasRole } from 'utils';
import SMLabelsForm from 'components/SMLabelsForm';
import ProbeStatus from './ProbeStatus';
import { validateLabel } from 'validation';
import { InstanceContext } from 'components/InstanceContext';

interface Props {
  probe: Probe;
  onReturn: (reload: boolean) => void;
}

const minInputWidth = css`
  min-width: 200px;
`;

const ProbeEditor: FC<Props> = ({ probe, onReturn }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState('');
  const { instance } = useContext(InstanceContext);

  if (!probe || !instance) {
    return <div>Loading...</div>;
  }

  const onSave = async (formValues: Probe) => {
    // Form values always come back as a string, even for number inputs
    formValues.latitude = Number(formValues.latitude);
    formValues.longitude = Number(formValues.longitude);

    if (probe.id) {
      await instance.api.updateProbe({
        ...probe,
        ...formValues,
      });
      onReturn(true);
    } else {
      const info = await instance.api.addProbe({
        ...probe,
        ...formValues,
      });
      setShowTokenModal(true);
      setProbeToken(info.token);
    }
  };

  const onRemoveProbe = async () => {
    if (!probe.id) {
      return;
    }
    await instance.api.deleteProbe(probe.id);
    onReturn(true);
  };

  const onResetToken = async () => {
    const info = await instance.api.resetProbeToken(probe);
    setShowTokenModal(true);
    setProbeToken(info.token);
  };

  const legend = probe.id ? 'Configuration' : 'Add Probe';

  const isEditor = !probe.public && hasRole(OrgRole.EDITOR);

  return (
    <HorizontalGroup align="flex-start">
      <Form onSubmit={onSave} validateOn="onChange" defaultValues={probe}>
        {({ register, errors, control, formState, getValues }) => {
          return (
            <div>
              <Legend>{legend}</Legend>
              <Container margin="md">
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
                    <Switch ref={register} name="public" disabled={!isEditor} />
                  </Container>
                </Field>
              </Container>
              <Container margin="md">
                <Legend>Location information</Legend>
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
                    id="probe-editor-longitude"
                    type="number"
                    placeholder="0.0"
                  />
                </Field>
              </Container>
              <Container margin="md">
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
                    name="region"
                    label="Region"
                    type="string"
                    placeholder="Region"
                  />
                </Field>
              </Container>
              <Container margin="md">
                <Field label="Labels" invalid={Boolean(errors.labels)} error="Name and value are required">
                  <InputControl
                    control={control}
                    as={SMLabelsForm}
                    name="labels"
                    type="Labels"
                    labels={getValues().labels || []}
                    rules={{
                      validate: (labels: SMLabel[]) => {
                        const isValid = !labels?.some(label => !validateLabel(label));
                        return isValid;
                      },
                    }}
                    onUpdate={(labels: SMLabel[]) => {
                      control.setValue('labels', labels, true);
                    }}
                    isEditor={isEditor}
                    limit={3}
                  />
                </Field>
              </Container>
              <Container margin="md">
                <HorizontalGroup>
                  <Button
                    type="submit"
                    disabled={!isEditor || !formState.isValid || !formState.touched || formState.isSubmitting}
                  >
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
      {probe.id && <ProbeStatus probe={probe} onResetToken={onResetToken} />}
    </HorizontalGroup>
  );
};

export default ProbeEditor;
