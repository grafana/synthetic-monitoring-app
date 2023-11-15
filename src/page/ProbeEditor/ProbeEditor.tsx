import React, { useContext, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import {
  Alert,
  Button,
  ConfirmModal,
  Field,
  HorizontalGroup,
  Input,
  Label,
  Legend,
  LinkButton,
  Modal,
  useStyles2,
} from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe, ProbePageParams, ROUTES } from 'types';
import { hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';
import { Clipboard } from 'components/Clipboard';
import { DocsLink } from 'components/DocsLink';
import { LabelField } from 'components/LabelField';
import { PluginPage } from 'components/PluginPage';
import { ProbeStatus } from 'components/ProbeStatus';
import { getRoute } from 'components/Routing';
import { SimpleMap } from 'components/SimpleMap';

import { useCreateProbe, useDeleteProbe, useResetProbeToken, useUpdateProbe } from './ProbeEditor.hooks';
import { getErrorInfo, getTitle } from './ProbeEditor.utils';

interface ProbeEditorProps {
  probes: Probe[];
  refetchProbes: () => void;
  error: string | null;
  loading: boolean;
  isNew?: boolean;
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
};

export const ProbeEditor = ({ probes, refetchProbes }: ProbeEditorProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState('');
  const { instance } = useContext(InstanceContext);
  const navigate = useNavigation();
  const { id } = useParams<ProbePageParams>();
  const isNew = !id;
  let probe: Probe = TEMPLATE_PROBE;

  if (!isNew) {
    const idInt = parseInt(id, 10);
    probe = probes.find((probe) => probe.id === idInt) ?? TEMPLATE_PROBE;
  }

  const onReset = (token: string) => {
    setShowTokenModal(true);
    setProbeToken(token);
  };

  const formMethods = useForm<Probe>({ defaultValues: probe, mode: 'onChange' });
  const styles = useStyles2(getStyles);
  const { onSave, error: createError } = useCreateProbe(probe, refetchProbes);
  const { onUpdate, error: updateError } = useUpdateProbe(probe, refetchProbes);
  const { onDelete, error: deleteError } = useDeleteProbe(probe, refetchProbes);
  const { onResetToken } = useResetProbeToken(probe, onReset);
  const errorInfo = getErrorInfo(createError, updateError, deleteError);

  if (!probe || !instance) {
    return <div>Loading...</div>;
  }

  const canEdit = !probe.public && hasRole(OrgRole.Editor);
  const { latitude, longitude } = formMethods.watch();
  const handleSubmit = formMethods.handleSubmit(isNew ? onSave : onUpdate);

  return (
    <PluginPage pageNav={{ text: getTitle(isNew, probe.public, probe.name) }}>
      <HorizontalGroup align="flex-start">
        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit}>
            <div>
              {probe.public ? (
                <Label
                  description="Public probes are run by Grafana Labs and can be used by all users."
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
                disabled={!canEdit}
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
              <div>
                <Legend>Location information</Legend>
                <Field
                  error="Must be between -90 and 90"
                  invalid={Boolean(formMethods.formState.errors.latitude)}
                  required
                  label="Latitude"
                  description="Latitude coordinates of this probe"
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
              </div>
              <div>
                <Field
                  error="Region is required"
                  invalid={Boolean(formMethods.formState.errors.region)}
                  required
                  label="Region"
                  description="Region of this probe"
                  disabled={!canEdit}
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
              </div>
              {canEdit && <LabelField isEditor={canEdit} limit={3} />}
              <div className={styles.buttonWrapper}>
                {canEdit && (
                  <>
                    <Button
                      type="submit"
                      disabled={
                        formMethods.formState.isSubmitting || Object.keys(formMethods.formState.errors ?? {}).length > 0
                      }
                    >
                      Save
                    </Button>
                    {probe.id && (
                      <Button type="button" variant="destructive" onClick={() => setShowDeleteModal(true)}>
                        Delete Probe
                      </Button>
                    )}
                  </>
                )}
                <LinkButton variant="secondary" href={getRoute(ROUTES.Probes)}>
                  Back
                </LinkButton>
              </div>
              {errorInfo && (
                <div className={styles.marginTop}>
                  <Alert title={errorInfo.title} severity="error">
                    {errorInfo.message}
                  </Alert>
                </div>
              )}
              <Modal
                isOpen={showTokenModal}
                title="Probe Authentication Token"
                onDismiss={() => (probe.id ? setShowTokenModal(false) : navigate(ROUTES.Probes))}
              >
                <Clipboard content={probeToken} />
                <DocsLink article="addPrivateProbe">Learn how to run a private probe</DocsLink>
              </Modal>
              <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Probe"
                body="Are you sure you want to delete this Probe?"
                confirmText="Delete Probe"
                onConfirm={onDelete}
                onDismiss={() => setShowDeleteModal(false)}
              />
            </div>
          </form>
        </FormProvider>
        {probe.id && <ProbeStatus probe={probe} onResetToken={onResetToken} />}
      </HorizontalGroup>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  buttonWrapper: css({
    display: `flex`,
    gap: theme.spacing(1),
  }),
  minInputWidth: css({
    minWidth: `200px`,
  }),
  marginTop: css({
    marginTop: theme.spacing(2),
  }),
  marginBottom: css({
    marginBottom: theme.spacing(2),
  }),
});
