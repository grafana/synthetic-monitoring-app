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
  const form = useForm<Probe>({ defaultValues: probe, mode: 'onChange' });
  const { latitude, longitude } = form.watch();
  const handleSubmit = form.handleSubmit((formValues: Probe) => onSubmit(formValues));
  const { errors, isSubmitting } = form.formState;

  return (
    <>
      <FormProvider {...form}>
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
              invalid={Boolean(errors.name)}
              label="Probe Name"
              description="Unique name of probe"
              disabled={!canEdit}
              required
            >
              <Input
                type="text"
                maxLength={32}
                {...form.register('name', {
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
                invalid={Boolean(errors.latitude)}
                required
                label="Latitude"
                description="Latitude coordinates of this probe"
                disabled={!canEdit}
              >
                <Input
                  {...form.register('latitude', {
                    required: true,
                    max: 90,
                    min: -90,
                    valueAsNumber: true,
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
                invalid={Boolean(errors.longitude)}
                required
                label="Longitude"
                description="Longitude coordinates of this probe"
                disabled={!canEdit}
              >
                <Input
                  {...form.register('longitude', {
                    required: true,
                    max: 180,
                    min: -180,
                    valueAsNumber: true,
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
                invalid={Boolean(errors.region)}
                required
                label="Region"
                description="Region of this probe"
                disabled={!canEdit}
                aria-label="Region"
              >
                <Input
                  {...form.register('region', { required: true })}
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
                  <Button type="submit" disabled={isSubmitting || Object.keys(errors ?? {}).length > 0}>
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
