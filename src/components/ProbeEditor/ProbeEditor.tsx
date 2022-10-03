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
import appEvents from 'grafana/app/core/app_events';
import { Probe, SubmissionErrorWrapper, ProbePageParams } from 'types';
import { hasRole } from 'utils';
import { LabelField } from 'components/LabelField';
import ProbeStatus from '../ProbeStatus';
import { InstanceContext } from 'contexts/InstanceContext';
import { trackEvent, trackException } from 'analytics';
import { GrafanaTheme2, AppEvents, OrgRole } from '@grafana/data';
import { Clipboard } from 'components/Clipboard';
import { SimpleMap } from '../SimpleMap';
import { useParams } from 'react-router-dom';
import { PluginPage } from '@grafana/runtime';

interface Props {
  probes?: Probe[];
  onReturn: (reload: boolean) => void;
}

const TEMPLATE_PROBE = {
  name: '',
  public: false,
  latitude: 0.0,
  longitude: 0.0,
  region: '',
  labels: [],
  online: false,
  onlineChange: 0,
  version: 'unknown',
  deprecated: false,
} as Probe;

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

const ProbeEditor = ({ probes, onReturn }: Props) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState('');
  const { instance } = useContext(InstanceContext);

  // If editing, find probe by id
  const { id } = useParams<ProbePageParams>();
  let probe: Probe = TEMPLATE_PROBE;
  if (id && probes) {
    const idInt = parseInt(id, 10);
    probe = probes.find((probe) => probe.id === idInt) ?? TEMPLATE_PROBE;
  }

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

  const submissionError = error as unknown as SubmissionErrorWrapper;

  if (error) {
    trackException(`addNewProbeSubmitException: ${error}`);
  }

  if (!probe || !instance) {
    return <div>Loading...</div>;
  }

  const onRemoveProbe = async () => {
    if (!probe.id || !instance.api) {
      appEvents.emit(AppEvents.alertError, ['Could not delete probe, please refresh and try again']);
      return;
    }
    try {
      await instance.api.deleteProbe(probe.id);
      onReturn(true);
    } catch (e) {
      const err = e as SubmissionErrorWrapper;
      const message = `${err.data?.msg} Make sure there are no checks assigned to this probe and try again.`;
      appEvents.emit(AppEvents.alertError, [message]);
    }
  };

  const onResetToken = async () => {
    const info = await instance.api?.resetProbeToken(probe);
    setShowTokenModal(true);
    setProbeToken(info.token);
  };

  const legend = probe.id ? 'Configuration' : 'Add Probe';

  const isEditor = !probe.public && hasRole(OrgRole.Editor);
  const { latitude, longitude } = formMethods.watch();

  return (
    <PluginPage pageNav={{ text: probe.id ? probe.name : 'Add probe', description: 'Probe configuration' }}>
      <HorizontalGroup align="flex-start">
        <FormProvider {...formMethods}>
          <form onSubmit={formMethods.handleSubmit(onSave)}>
            <div>
              <Legend>{legend}</Legend>
              <Container margin="md">
                {probe.public ? (
                  <Label
                    description="Public probes are run by Grafana Labs and can be used by all users"
                    className={styles.marginBottom}
                  >
                    This probe is public
                  </Label>
                ) : (
                  <Label
                    description="Private probes are operated by your organization and can only run your checks."
                    className={styles.marginBottom}
                  >
                    This probe is private
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
                <SimpleMap latitude={latitude} longitude={longitude} />
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
                  aria-label="Region"
                >
                  <Input
                    {...formMethods.register('region', { required: true })}
                    label="Region"
                    type="text"
                    placeholder="Region"
                  />
                </Field>
              </Container>
              <Container margin="md">
                <LabelField isEditor={isEditor} limit={3} />
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
                    {`${submissionError.status}: ${
                      submissionError.data.msg ?? submissionError.data.message ?? 'There was an error saving the check'
                    }`}
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
    </PluginPage>
  );
};

export default ProbeEditor;
