import { css } from '@emotion/css';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  Alert,
  Button,
  ConfirmModal,
  Field,
  HorizontalGroup,
  Input,
  Legend,
  LinkButton,
  useStyles2,
} from '@grafana/ui';
import { CheckFormAlert } from 'components/CheckFormAlert';
import CheckTarget from 'components/CheckTarget';
import { CheckTestButton } from 'components/CheckTestButton';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';
import { PluginPage } from 'components/PluginPage';
import { fallbackCheck } from 'components/constants';
import { InstanceContext } from 'contexts/InstanceContext';
import { FaroEvent, reportError, reportEvent } from 'faro';
import React, { useContext, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { Check, CheckFormValues, CheckPageParams, CheckType, SubmissionErrorWrapper } from 'types';
import { checkType as getCheckType, hasRole } from 'utils';
import { validateJob, validateTarget } from 'validation';
import { CheckUsage } from '../CheckUsage';
import { CheckSettings } from './CheckSettings';
import { ProbeOptions } from './ProbeOptions';
import {
  checkTypeParamToCheckType,
  getCheckFromFormValues,
  getDefaultValuesFromCheck,
} from './checkFormTransformations';

interface Props {
  checks?: Check[];
  onReturn: (reload: boolean) => void;
}

const getStyles = (theme: GrafanaTheme2) => ({
  breakLine: css`
    margin-top: ${theme.spacing(3)};
  `,
  submissionError: css`
    margin-top: ${theme.spacing(2)};
  `,
});

export const CheckEditor = ({ checks, onReturn }: Props) => {
  const {
    instance: { api },
  } = useContext(InstanceContext);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const styles = useStyles2(getStyles);
  // If we're editing, grab the appropriate check from the list
  const { id, checkType: checkTypeParam } = useParams<CheckPageParams>();
  let checkType = checkTypeParamToCheckType(checkTypeParam);
  let check: Check = fallbackCheck(checkType);

  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheck(checkType);
  }
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const formMethods = useForm<CheckFormValues>({ defaultValues, mode: 'onChange' });
  const selectedCheckType = formMethods.watch('checkType')?.value ?? null;

  if (id) {
    checkType = getCheckType(check.settings);
  } else if (selectedCheckType && !id) {
    checkType = selectedCheckType;
  }

  const isEditor = hasRole(OrgRole.Editor);

  const {
    execute: onSubmit,
    error,
    loading: submitting,
  } = useAsyncCallback(async (checkValues: CheckFormValues) => {
    const updatedCheck = getCheckFromFormValues(checkValues, defaultValues, checkType);
    if (check?.id) {
      reportEvent(FaroEvent.UPDATE_CHECK, { type: checkType });
      await api?.updateCheck({
        id: check.id,
        tenantId: check.tenantId,
        ...updatedCheck,
      });
    } else {
      reportEvent(FaroEvent.CREATE_CHECK);
      await api?.addCheck(updatedCheck);
    }
    onReturn(true);
  });
  const submissionError = error as unknown as SubmissionErrorWrapper;
  if (error) {
    reportError(error.message ?? error, check?.id ? FaroEvent.UPDATE_CHECK : FaroEvent.CREATE_CHECK);
  }
  const onRemoveCheck = async () => {
    const id = check?.id;
    if (!id) {
      return;
    }
    reportEvent(FaroEvent.DELETE_CHECK, { type: checkType });
    await api?.deleteCheck(id);
    onReturn(true);
  };

  const capitalizedCheckType = checkType.slice(0, 1).toUpperCase().concat(checkType.split('').slice(1).join(''));
  const headerText = check?.id ? `Editing ${check.job}` : `Add ${capitalizedCheckType} check`;
  return (
    <PluginPage
      pageNav={{ text: check?.job ? `Editing ${check.job}` : headerText, description: 'Check configuration' }}
    >
      <>
        {!config.featureToggles.topnav && <Legend>{headerText}</Legend>}
        <FormProvider {...formMethods}>
          <form onSubmit={formMethods.handleSubmit(onSubmit)}>
            <HorizontalCheckboxField
              disabled={!isEditor}
              name="enabled"
              id="check-form-enabled"
              label="Enabled"
              description="If a check is enabled, metrics and logs are published to your Grafana Cloud stack."
            />
            <Field
              label="Job name"
              description={'Name used for job label (in metrics it will appear as `jobName=X`)'}
              disabled={!isEditor}
              invalid={Boolean(formMethods.formState.errors.job)}
              error={formMethods.formState.errors.job?.message}
            >
              <Input
                id="check-editor-job-input"
                {...formMethods.register('job', {
                  required: true,
                  validate: validateJob,
                })}
                type="text"
                placeholder="jobName"
              />
            </Field>
            <Controller
              name="target"
              control={formMethods.control}
              rules={{
                required: true,
                validate: (target) => {
                  return validateTarget(checkType, target);
                },
              }}
              render={({ field }) => (
                <CheckTarget
                  {...field}
                  typeOfCheck={checkType}
                  invalid={Boolean(formMethods.formState.errors.target)}
                  error={formMethods.formState.errors.target?.message}
                  disabled={!isEditor}
                />
              )}
            />

            <hr className={styles.breakLine} />
            <ProbeOptions
              isEditor={isEditor}
              checkType={checkType}
              timeout={check?.timeout ?? fallbackCheck(checkType).timeout}
              frequency={check?.frequency ?? fallbackCheck(checkType).frequency}
              probes={check?.probes ?? fallbackCheck(checkType).probes}
            />
            <HorizontalCheckboxField
              name="publishAdvancedMetrics"
              id="publishAdvancedMetrics"
              label="Publish full set of metrics"
              description="Histogram buckets are removed by default in order to reduce the amount of active series generated per check. If you want to calculate Apdex scores or visualize heatmaps, publish the full set of metrics."
            />
            <CheckUsage />
            <CheckSettings
              typeOfCheck={
                (selectedCheckType as CheckType) ?? (String(Object.keys(check.settings)) as CheckType) ?? CheckType.PING
              }
              isEditor={isEditor}
            />
            <CheckFormAlert />
            <HorizontalGroup height="40px">
              <Button type="submit" disabled={formMethods.formState.isSubmitting || submitting}>
                Save
              </Button>
              <CheckTestButton check={check} />
              {check?.id && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={!isEditor}
                  type="button"
                >
                  Delete Check
                </Button>
              )}

              <LinkButton onClick={() => onReturn(true)} fill="text" variant="secondary">
                Cancel
              </LinkButton>
            </HorizontalGroup>
            {submissionError && (
              <div className={styles.submissionError}>
                <Alert title="Save failed" severity="error">
                  {`${submissionError.status}: ${
                    submissionError.data?.msg?.concat(', ', submissionError.data?.err ?? '') ?? 'Something went wrong'
                  }`}
                </Alert>
              </div>
            )}
          </form>
        </FormProvider>
      </>
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete check"
        body="Are you sure you want to delete this check?"
        confirmText="Delete check"
        onConfirm={onRemoveCheck}
        onDismiss={() => setShowDeleteModal(false)}
      />
    </PluginPage>
  );
};
