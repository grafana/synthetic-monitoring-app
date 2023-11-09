import React, { useContext, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { AppEvents, GrafanaTheme2, OrgRole } from '@grafana/data';
import {
  Alert,
  Button,
  ConfirmModal,
  Container,
  Field,
  HorizontalGroup,
  Icon,
  Input,
  Label,
  Legend,
  LinkButton,
  Modal,
  useStyles2,
} from '@grafana/ui';
import appEvents from 'grafana/app/core/app_events';
import { css } from '@emotion/css';

import { Probe, ProbePageParams, ROUTES, SubmissionErrorWrapper } from 'types';
import { FaroEvent, reportError, reportEvent } from 'faro';
import { hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';
import { Clipboard } from 'components/Clipboard';
import { LabelField } from 'components/LabelField';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';

import ProbeStatus from '../ProbeStatus';
import { SimpleMap } from '../SimpleMap';

interface Props {
  probes?: Probe[];
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
  externalLink: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  link: css`
    text-decoration: underline;
  `,
});

const ProbeEditor = ({ probes }: Props) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState('');
  const { instance } = useContext(InstanceContext);
  const navigate = useNavigation();

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
    reportEvent(FaroEvent.CREATE_PROBE);
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
      navigate(ROUTES.Probes);
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
    reportError(error.message ?? error, FaroEvent.CREATE_PROBE);
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
      navigate(ROUTES.Probes);
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
    <PluginPage pageNav={{ text: probe.id ? probe.name : 'Add probe' }}>
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
                  <LinkButton variant="secondary" href={getRoute(ROUTES.Probes)}>
                    Back
                  </LinkButton>
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
                onDismiss={() => (probe.id ? setShowTokenModal(false) : navigate(ROUTES.Probes))}
              >
                <Clipboard content={probeToken} />
                <div className={styles.externalLink}>
                  <a
                    href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/private-probes/#add-a-new-probe-in-your-grafana-instance"
                    target="blank"
                    rel="noopener noreferer"
                    className={styles.link}
                  >
                    Learn how to run a private probe
                  </a>
                  <Icon name="external-link-alt" />
                </div>
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
