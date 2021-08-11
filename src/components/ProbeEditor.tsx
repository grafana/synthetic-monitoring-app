import React, { useState, useContext } from 'react';
import { css } from '@emotion/css';
import {
  Modal,
  Button,
  Container,
  ConfirmModal,
  Field,
  Input,
  HorizontalGroup,
  Legend,
  Alert,
  useStyles2,
  Label,
} from '@grafana/ui';
import { useForm, FormProvider } from 'react-hook-form';
import { useAsyncCallback } from 'react-async-hook';
import { Probe, OrgRole, SubmissionError } from 'types';
import { hasRole } from 'utils';
import { LabelField } from 'components/LabelField';
import ProbeStatus from './ProbeStatus';
import { InstanceContext } from 'contexts/InstanceContext';
import { trackEvent, trackException } from 'analytics';
import { GrafanaTheme2 } from '@grafana/data';
import { Clipboard } from 'components/Clipboard';

interface Props {
  probe: Probe;
  onReturn: (reload: boolean) => void;
}

const getStyles = (theme: GrafanaTheme2) => ({
  minInputWidth: css`
    min-width: 200px;
  `,
  modalBody: css`
    word-break: break-all;
  `,
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
  marginBottom: css`
    margin-bottom: ${theme.spacing(2)};
  `,
});

const ProbeEditor = ({ probe, onReturn }: Props) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState('');
  const { instance } = useContext(InstanceContext);
  const formMethods = useForm<Probe>({ defaultValues: probe, mode: 'onChange' });
  const styles = useStyles2(getStyles);

  const { execute: onSave, error } = useAsyncCallback(async (formValues: Probe) => {
    trackEvent('addNewProbeSubmit');
    // Form values always come back as a string, even for number inputs
    formValues.latitude = Number(formValues.latitude);
    formValues.longitude = Number(formValues.longitude);

    if (!instance.api) {
      throw new Error('Not connected to the Synthetic Montoring datasource');
    }

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
        public: false,
      });
      setShowTokenModal(true);
      setProbeToken(info.token);
    }
  });

  const submissionError = error as SubmissionError;

  if (error) {
    trackException(`addNewProbeSubmitException: ${error}`);
  }

  if (!probe || !instance) {
    return <div>Loading...</div>;
  }

  const onRemoveProbe = async () => {
    if (!probe.id || !instance.api) {
      return;
    }
    await instance.api.deleteProbe(probe.id);
    onReturn(true);
  };

  const onResetToken = async () => {
    const info = await instance.api?.resetProbeToken(probe);
    setShowTokenModal(true);
    setProbeToken(info.token);
  };

  const legend = probe.id ? 'Configuration' : 'Add Probe';

  const isEditor = !probe.public && hasRole(OrgRole.EDITOR);

  return (
    <HorizontalGroup align="flex-start">
      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSave)}>
          <div>
            <Legend>{legend}</Legend>
            <Container margin="md">
              {probe.public && (
                <Label
                  description="Public probes are run by Grafana Labs and can be used by all users"
                  className={styles.marginBottom}
                >
                  This probe is public
                </Label>
              )}
              <Field
                error="Name is required"
                invalid={Boolean(formMethods.formState.errors.name)}
                label="Probe Name"
                description="Unique name of probe"
                disabled={!isEditor}
                className={styles.minInputWidth}
                required
              >
                <Input
                  type="text"
                  maxLength={32}
                  {...formMethods.register('name', {
                    required: true,
                    maxLength: 32,
                  })}
                  id="probe-name-input"
                  placeholder="Probe name"
                />
              </Field>
            </Container>
            <Container margin="md">
              <Legend>Location information</Legend>
              <Field
                error="Must be between -90 and 90"
                invalid={Boolean(formMethods.formState.errors.latitude)}
                required
                label="Latitude"
                description="Latitude coordinates of this probe"
                disabled={!isEditor}
                className={styles.minInputWidth}
              >
                <Input
                  {...formMethods.register('latitude', {
                    required: true,
                    max: 90,
                    min: -90,
                  })}
                  label="Latitude"
                  max={90}
                  min={-90}
                  step={0.00001}
                  id="probe-editor-latitude"
                  type="number"
                  placeholder="0.0"
                />
              </Field>
              <Field
                error="Must be between -180 and 180"
                invalid={Boolean(formMethods.formState.errors.longitude)}
                required
                label="Longitude"
                description="Longitude coordinates of this probe"
                disabled={!isEditor}
              >
                <Input
                  {...formMethods.register('longitude', {
                    required: true,
                    max: 180,
                    min: -180,
                  })}
                  label="Longitude"
                  max={180}
                  min={-180}
                  step={0.00001}
                  id="probe-editor-longitude"
                  type="number"
                  placeholder="0.0"
                />
              </Field>
            </Container>
            <Container margin="md">
              <Field
                error="Region is required"
                invalid={Boolean(formMethods.formState.errors.region)}
                required
                label="Region"
                description="Region of this probe"
                disabled={!isEditor}
                className={styles.minInputWidth}
              >
                <Input
                  {...formMethods.register('region', { required: true })}
                  label="Region"
                  type="string"
                  placeholder="Region"
                />
              </Field>
            </Container>
            <Container margin="md">
              <Field
                label="Labels"
                invalid={Boolean(formMethods.formState.errors.labels)}
                error="Name and value are required"
              >
                <LabelField isEditor={isEditor} limit={3} />
              </Field>
            </Container>
            <Container margin="md">
              <HorizontalGroup>
                <Button
                  type="submit"
                  disabled={
                    !isEditor ||
                    formMethods.formState.isSubmitting ||
                    Object.keys(formMethods.formState.errors ?? {}).length > 0
                  }
                >
                  Save
                </Button>
                {probe.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={!isEditor}
                  >
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
                <Button variant="secondary" onClick={() => onReturn(false)} type="button">
                  Back
                </Button>
              </HorizontalGroup>
            </Container>
            {submissionError && (
              <div className={styles.marginTop}>
                <Alert title="Save failed" severity="error">
                  {`${submissionError.status}: ${submissionError.message}`}
                </Alert>
              </div>
            )}
            <Modal
              isOpen={showTokenModal}
              title="Probe Authentication Token"
              icon={'lock'}
              onDismiss={() => (probe.id ? setShowTokenModal(false) : onReturn(false))}
            >
              <Clipboard content={probeToken} />
            </Modal>
          </div>
        </form>
      </FormProvider>
      {probe.id && <ProbeStatus probe={probe} onResetToken={onResetToken} />}
    </HorizontalGroup>
  );
};

export default ProbeEditor;
