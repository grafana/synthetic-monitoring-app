import React from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { locationService, PluginPage } from '@grafana/runtime';
import { Alert, Button, Field, Icon, Input, Label, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckFormValues, CheckPageParams, CheckType } from 'types';
import { hasRole } from 'utils';
import { useChecks, useCUDChecks } from 'data/useChecks';

import {
  checkTypeParamToCheckType,
  getCheckFromFormValues,
  getDefaultValuesFromCheck,
} from './CheckEditor/checkFormTransformations';
import { ProbeOptions } from './CheckEditor/ProbeOptions';
import { CheckFormAlert } from './CheckFormAlert';
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
    saveButton: css({
      alignSelf: 'flex-start',
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

export function K6CheckCodeEditor() {
  const { data: checks } = useChecks();
  const { id, checkType: checkTypeParam } = useParams<CheckPageParams>();
  const { updateCheck, createCheck, error, submitting } = useCUDChecks({ eventInfo: { checkType: CheckType.K6 } });

  let checkType = checkTypeParamToCheckType(checkTypeParam);
  let check: Check = fallbackCheck(checkType);

  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheck(checkType);
  }

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
            <Field label="Job name">
              <Input id="job" {...register('job')} />
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
            >
              <Input id="target" {...register('target')} />
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
          <Button type="submit" disabled={submitting} className={styles.saveButton}>
            Save
          </Button>
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
