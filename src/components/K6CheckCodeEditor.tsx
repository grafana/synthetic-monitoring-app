import React from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { locationService, PluginPage } from '@grafana/runtime';
import { Alert, Button, Field, Icon, Input, Label, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckFormValues, CheckPageParams, CheckType } from 'types';
import { hasRole } from 'utils';
import { validateJob, validateTarget } from 'validation';
import { useChecks, useCUDChecks } from 'data/useChecks';

import { getCheckFromFormValues, getDefaultValuesFromCheck } from './CheckEditor/checkFormTransformations';
import { ProbeOptions } from './CheckEditor/ProbeOptions';
import { CheckFormAlert } from './CheckFormAlert';
import { CheckTestButton } from './CheckTestButton';
import { CodeEditor } from './CodeEditor';
import { fallbackCheck } from './constants';
import { LabelField } from './LabelField';

function getStyles(theme: GrafanaTheme2) {
  return {
    headerContainer: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
    }),
    jobTargetContainer: css({
      display: 'flex',
      flexDirection: 'column',
      maxWidth: theme.breakpoints.values.md,
    }),
    buttonGroup: css({
      display: 'flex',
      gap: theme.spacing(1),
      marginTop: theme.spacing(2),
    }),
    infoIcon: css({
      fontWeight: theme.typography.fontWeightLight,
    }),
    submissionError: css({
      marginTop: theme.spacing(2),
    }),
  };
}

export const K6CheckCodeEditor = () => {
  const { data: checks } = useChecks();
  const { id } = useParams<CheckPageParams>();

  if (id && !checks) {
    return null;
  }

  const check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheck(CheckType.K6);

  return <K6CheckCodeEditorContent check={check} />;
};

function K6CheckCodeEditorContent({ check }: { check: Check }) {
  const { updateCheck, createCheck, error, submitting } = useCUDChecks({ eventInfo: { checkType: CheckType.K6 } });
  const defaultValues = getDefaultValuesFromCheck(check);

  const formMethods = useForm<CheckFormValues>({
    defaultValues,
  });
  const { handleSubmit, register, control } = formMethods;
  const styles = useStyles2(getStyles);
  const onSuccess = () => locationService.getHistory().goBack();

  const onSubmit = (checkValues: CheckFormValues) => {
    const toSubmit = getCheckFromFormValues(checkValues, defaultValues, CheckType.K6);

    if (check.id) {
      return updateCheck(
        {
          id: check.id,
          tenantId: check.tenantId,
          ...toSubmit,
        },
        { onSuccess }
      );
    }

    return createCheck(toSubmit, { onSuccess });
  };

  const headerText = check?.id ? `Editing ${check.job}` : `Add a scripted check`;
  const isEditor = hasRole(OrgRole.Editor);

  return (
    <PluginPage pageNav={{ text: check?.job ? `Editing ${check.job}` : headerText }}>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.jobTargetContainer}>
            <Field
              label="Job name"
              invalid={Boolean(formMethods.formState.errors.job)}
              error={formMethods.formState.errors.job?.message}
              required
            >
              <Input
                id="job"
                {...register('job', {
                  required: true,
                  validate: validateJob,
                })}
              />
            </Field>
            <Field
              label={
                <Label htmlFor="target">
                  Instance&nbsp;
                  <Tooltip
                    content={
                      <span>
                        Metrics and logs produced as a result of this check will follow the Prometheus convention of
                        being identified by a job and instance. The job/instance pair is guaranteed unique and the
                        method by which results are queried. Read more about the job/instance convention at
                        prometheus.io
                      </span>
                    }
                  >
                    <Icon name="info-circle" className={styles.infoIcon} />
                  </Tooltip>
                </Label>
              }
              invalid={Boolean(formMethods.formState.errors.target)}
              error={formMethods.formState.errors.target?.message}
              required
            >
              <Input
                id="target"
                {...register('target', {
                  required: true,
                  validate: (value) => validateTarget(CheckType.K6, value),
                })}
              />
            </Field>

            <ProbeOptions
              isEditor={isEditor}
              frequency={check.frequency}
              timeout={check.timeout}
              checkType={CheckType.K6}
            />
            <LabelField isEditor={isEditor} />
            <CheckFormAlert />
          </div>
          <Controller
            name="settings.k6.script"
            control={control}
            render={({ field: { ...field } }) => {
              return <CodeEditor {...field} />;
            }}
          />
          <div className={styles.buttonGroup}>
            <CheckTestButton check={check} />
            <Button type="submit" disabled={submitting}>
              Save
            </Button>
          </div>
        </form>
        {error && (
          <div className={styles.submissionError}>
            <Alert title="Save failed" severity="error">
              {error.message ?? 'Something went wrong'}
            </Alert>
          </div>
        )}
      </FormProvider>
    </PluginPage>
  );
}
