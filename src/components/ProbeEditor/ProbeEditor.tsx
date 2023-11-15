import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Alert, Button, Field, Input, Label, Legend, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe, ROUTES } from 'types';
import { hasRole } from 'utils';
import { LabelField } from 'components/LabelField';
import { getRoute } from 'components/Routing';
import { SimpleMap } from 'components/SimpleMap';

type ProbeEditorProps = {
  actions?: ReactNode;
  errorInfo?: { title: string; message: string };
  onSubmit: (formValues: Probe) => void;
  probe: Probe;
  submitText: string;
};

export const ProbeEditor = ({ actions, errorInfo, onSubmit, probe, submitText }: ProbeEditorProps) => {
  const styles = useStyles2(getStyles);
  const canEdit = !probe.public && hasRole(OrgRole.Editor);
  const formMethods = useForm<Probe>({ defaultValues: probe, mode: 'onChange' });
  const { latitude, longitude } = formMethods.watch();
  const handleSubmit = formMethods.handleSubmit((formValues: Probe) => onSubmit(normalizeProbeValues(formValues)));

  return (
    <>
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
                    {submitText}
                  </Button>
                </>
              )}
              {actions}
              <LinkButton variant="secondary" href={getRoute(ROUTES.Probes)}>
                Back
              </LinkButton>
            </div>
          </div>
        </form>
      </FormProvider>
      {errorInfo && (
        <div className={styles.marginTop}>
          <Alert title={errorInfo.title} severity="error">
            {errorInfo.message}
          </Alert>
        </div>
      )}
    </>
  );
};

// Form values always come back as a string, even for number inputs
export function normalizeProbeValues(probe: Probe) {
  return {
    ...probe,
    latitude: Number(probe.latitude),
    longitude: Number(probe.longitude),
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  buttonWrapper: css({
    display: `flex`,
    gap: theme.spacing(1),
  }),
  marginTop: css({
    marginTop: theme.spacing(2),
  }),
  marginBottom: css({
    marginBottom: theme.spacing(2),
  }),
});
