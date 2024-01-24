import React, { useContext } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Button, Field, Icon, Input, Label, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckFormValues, CheckPageParams, CheckType, SubmissionErrorWrapper } from 'types';
import { FaroEvent, reportError } from 'faro';
import { hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';

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

interface Props {
  checks: Check[];
  onSubmitSuccess?: (refresh: boolean) => void;
}

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
  };
}

export function K6CheckCodeEditor({ checks, onSubmitSuccess }: Props) {
  const { id, checkType: checkTypeParam } = useParams<CheckPageParams>();
  let checkType = checkTypeParamToCheckType(checkTypeParam);
  let check: Check = fallbackCheck(checkType);

  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheck(checkType);
  }

  const { instance } = useContext(InstanceContext);
  const defaultValues = getDefaultValuesFromCheck(check);

  const formMethods = useForm<CheckFormValues>({
    defaultValues,
  });
  const { handleSubmit, register, control } = formMethods;
  const styles = useStyles2(getStyles);

  const {
    execute: onSubmit,
    error,
    loading: submitting,
  } = useAsyncCallback(async (checkValues: CheckFormValues) => {
    if (error) {
      console.error(error);
      return;
    }
    if (!checkValues.settings.k6) {
      throw new Error('No k6 settings');
    }
    const toSubmit = getCheckFromFormValues(checkValues, defaultValues, CheckType.K6);
    if (check.id) {
      await instance.api?.updateCheck({
        id: check.id,
        tenantId: check.tenantId,
        ...toSubmit,
      });
    } else {
      await instance.api?.addCheck(toSubmit);
    }

    if (onSubmitSuccess) {
      onSubmitSuccess(true);
    }
  });

  const submissionError = error as unknown as SubmissionErrorWrapper;
  if (error) {
    reportError(error.message ?? error, check?.id ? FaroEvent.UPDATE_CHECK : FaroEvent.CREATE_CHECK);
  }
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
                <Label>
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
            {submissionError && (
              <Alert title="Save failed" severity="error">
                {`${submissionError.status}: ${
                  submissionError.data?.msg?.concat(', ', submissionError.data?.err ?? '') ?? 'Something went wrong'
                }`}
              </Alert>
            )}
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
      </FormProvider>
    </PluginPage>
  );
}
