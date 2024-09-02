import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Field, Input, Label, Legend, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProbeSchema } from 'schemas/forms/ProbeSchema';

import { FeatureName, Probe, ROUTES } from 'types';
import { useCanEditProbe } from 'hooks/useCanEditProbe';
import { FeatureFlag } from 'components/FeatureFlag';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';
import { LabelField } from 'components/LabelField';
import { ProbeRegionsSelect } from 'components/ProbeRegionsSelect';
import { getRoute } from 'components/Routing.utils';
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
  const canEdit = useCanEditProbe(probe);
  const form = useForm<Probe>({ defaultValues: probe, resolver: zodResolver(ProbeSchema) });
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
          <FormProvider<Probe> {...form}>
            <form onSubmit={handleSubmit}>
              <div>
                <Label description={description} className={styles.marginBottom}>
                  {`This probe is ${probe.public ? 'public' : 'private'}.`}
                </Label>
                <Field
                  error={errors.name?.message}
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
                    {...form.register('name')}
                    placeholder="Probe name"
                  />
                </Field>
                <div>
                  <Legend>Location information</Legend>
                  <Field
                    error={errors.latitude?.message}
                    invalid={Boolean(errors.latitude)}
                    required
                    label="Latitude"
                    description="Latitude coordinates for this probe."
                    disabled={!canEdit}
                  >
                    <Input
                      {...form.register('latitude', {
                        valueAsNumber: true,
                      })}
                      aria-label="Latitude"
                      placeholder="0.0"
                      step={0.00001}
                      type="number"
                    />
                  </Field>
                  <Field
                    error={errors.longitude?.message}
                    invalid={Boolean(errors.longitude)}
                    required
                    label="Longitude"
                    description="Longitude coordinates for this probe."
                    disabled={!canEdit}
                  >
                    <Input
                      {...form.register('longitude', {
                        valueAsNumber: true,
                      })}
                      aria-label="Longitude"
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
                    error={errors.region?.message}
                    invalid={Boolean(errors.region)}
                    required
                    htmlFor="region"
                  >
                    <Controller
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <ProbeRegionsSelect
                          disabled={!canEdit}
                          id="region"
                          invalid={Boolean(errors.region)}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          value={field.value}
                        />
                      )}
                    />
                  </Field>
                </div>
                {canEdit && <LabelField<Probe> disabled={!canEdit} labelDestination={'probe'} />}
                <div className={styles.marginBottom}>
                  <Legend>Capabilities</Legend>
                  <HorizontalCheckboxField
                    {...form.register('capabilities.disableScriptedChecks')}
                    label="Disable scripted checks"
                    description="Prevent probe from running k6 based scripted checks."
                    disabled={!canEdit}
                    id="capabilities.disableScriptedChecks"
                  />
                  <FeatureFlag name={FeatureName.BrowserChecks}>
                    {({ isEnabled }) =>
                      isEnabled ? (
                        <HorizontalCheckboxField
                          {...form.register('capabilities.disableBrowserChecks')}
                          label="Disable browser checks"
                          description="Prevent probe from running k6 based browser checks."
                          disabled={!canEdit}
                          id="capabilities.disableBrowserChecks"
                        />
                      ) : null
                    }
                  </FeatureFlag>
                </div>
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
