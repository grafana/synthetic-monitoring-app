import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Field, Input, Label, Legend, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe, ROUTES } from 'types';
import { canEditProbes } from 'utils';
import { LabelField } from 'components/LabelField';
import { getRoute } from 'components/Routing';
import { SimpleMap } from 'components/SimpleMap';

type ProbeEditorProps = {
  actions?: ReactNode;
  errorInfo?: { title: string; message: string };
  onSubmit: (formValues: Probe) => void;
  probe: Probe;
  submitText: string;
  supportingContent?: ReactNode;
};

export const ProbeEditor = ({
  actions,
  errorInfo,
  onSubmit,
  probe,
  submitText,
  supportingContent,
}: ProbeEditorProps) => {
  const styles = useStyles2(getStyles);
  const canEdit = canEditProbes(probe);
  const form = useForm<Probe>({ defaultValues: probe, mode: 'onChange' });
  const { latitude, longitude } = form.watch();
  const handleSubmit = form.handleSubmit((formValues: Probe) => onSubmit(formValues));
  const { errors, isSubmitting } = form.formState;
  const alertRef = useRef<HTMLDivElement>(null);
  const loading = form.formState.isSubmitting;

  const getCoordsFromMap = useCallback(
    ([long, lat]: number[]) => {
      const significantDigits = 5;
      form.setValue('longitude', +long.toFixed(significantDigits));
      form.setValue('latitude', +lat.toFixed(significantDigits));
      form.clearErrors(['longitude', 'latitude']);
    },
    [form]
  );

  const description = probe.public
    ? 'Public probes are run by Grafana Labs and can be used by all users. They cannot be edited.'
    : 'Private probes are operated by your organization and can only run your checks.';

  useEffect(() => {
    if (alertRef.current && errorInfo) {
      alertRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [alertRef, errorInfo]);

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <div>
          <FormProvider {...form}>
            <form onSubmit={handleSubmit}>
              <div>
                <Label description={description} className={styles.marginBottom}>
                  {`This probe is ${probe.public ? 'public' : 'private'}.`}
                </Label>
                <Field
                  error="Name is required"
                  invalid={Boolean(errors.name)}
                  label="Probe Name"
                  description="Unique name for this probe."
                  disabled={!canEdit}
                  required
                >
                  <Input
                    aria-label="Probe name"
                    type="text"
                    maxLength={32}
                    {...form.register('name', {
                      required: true,
                      maxLength: 32,
                    })}
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
                    description="Latitude coordinates for this probe."
                    disabled={!canEdit}
                  >
                    <Input
                      {...form.register('latitude', {
                        required: true,
                        max: 90,
                        min: -90,
                        valueAsNumber: true,
                      })}
                      aria-label="Latitude"
                      max={90}
                      min={-90}
                      placeholder="0.0"
                      step={0.00001}
                      type="number"
                    />
                  </Field>
                  <Field
                    error="Must be between -180 and 180"
                    invalid={Boolean(errors.longitude)}
                    required
                    label="Longitude"
                    description="Longitude coordinates for this probe."
                    disabled={!canEdit}
                  >
                    <Input
                      {...form.register('longitude', {
                        required: true,
                        max: 180,
                        min: -180,
                        valueAsNumber: true,
                      })}
                      aria-label="Longitude"
                      max={180}
                      min={-180}
                      step={0.00001}
                      type="number"
                      placeholder="0.0"
                    />
                  </Field>
                  <div className={styles.marginBottom}>
                    <SimpleMap canEdit={canEdit} latitude={latitude} longitude={longitude} onClick={getCoordsFromMap} />
                    {canEdit && <div className={styles.caption}>Click on the map to place the probe.</div>}
                  </div>
                  <Field
                    label="Region"
                    description="Region of this probe."
                    disabled={!canEdit}
                    error="Region is required"
                    invalid={Boolean(errors.region)}
                    required
                  >
                    <Input
                      {...form.register('region', { required: true })}
                      aria-label="Region"
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
                        icon={loading ? 'fa fa-spinner' : undefined}
                        type="submit"
                        disabled={isSubmitting || Object.keys(errors ?? {}).length > 0}
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
            <div className={styles.marginTop} ref={alertRef}>
              <Alert title={errorInfo.title} severity="error">
                {errorInfo.message}
              </Alert>
            </div>
          )}
        </div>
        {supportingContent && <div className={styles.supportingWrapper}>{supportingContent}</div>}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = `probeEditor`;
  const breakpoint = theme.breakpoints.values.md;
  const containerQuery = `@container ${containerName} (max-width: ${breakpoint}px)`;
  const mediaQuery = `@supports not (container-type: inline-size) @media (max-width: ${breakpoint}px)`;

  return {
    containerWrapper: css({
      containerName,
      containerType: `inline-size`,
    }),
    container: css({
      display: 'grid',
      gridTemplateColumns: `repeat(2, 1fr)`,
      gap: theme.spacing(4),
      width: `850px`,
      maxWidth: `100%`,

      [containerQuery]: {
        gridTemplateColumns: '1fr',
      },
      [mediaQuery]: {
        gridTemplateColumns: '1fr',
      },
    }),
    buttonWrapper: css({
      display: `flex`,
      gap: theme.spacing(1),
      marginTop: theme.spacing(4),
    }),
    marginTop: css({
      marginTop: theme.spacing(2),
    }),
    marginBottom: css({
      marginBottom: theme.spacing(2),
    }),
    caption: css({
      fontStyle: `italic`,
    }),
    supportingWrapper: css({
      [containerQuery]: {
        borderTop: `1px solid ${theme.colors.border.medium}`,
        paddingTop: theme.spacing(4),
      },
      [mediaQuery]: {
        borderTop: `1px solid ${theme.colors.border.medium}`,
        paddingTop: theme.spacing(4),
      },
    }),
  };
};
