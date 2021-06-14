import React, { useState, useMemo, useContext } from 'react';
import { css } from '@emotion/css';
import { Button, ConfirmModal, Field, Input, HorizontalGroup, Select, Legend, Alert, useStyles } from '@grafana/ui';
import { useAsyncCallback } from 'react-async-hook';
import { Check, CheckType, OrgRole, CheckFormValues, SubmissionError } from 'types';
import { hasRole } from 'utils';
import { getDefaultValuesFromCheck, getCheckFromFormValues } from './checkFormTransformations';
import { validateJob, validateTarget } from 'validation';
import CheckTarget from 'components/CheckTarget';
import { Subheader } from 'components/Subheader';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';
import { CheckSettings } from './CheckSettings';
import { ProbeOptions } from './ProbeOptions';
import { CHECK_TYPE_OPTIONS, fallbackCheck } from 'components/constants';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { GrafanaTheme } from '@grafana/data';
import { CheckUsage } from '../CheckUsage';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { InstanceContext } from 'contexts/InstanceContext';
import { trackEvent, trackException } from 'analytics';

interface Props {
  check?: Check;
  onReturn: (reload: boolean) => void;
}

const getStyles = (theme: GrafanaTheme) => ({
  formBody: css`
    margin-bottom: ${theme.spacing.sm};
  `,
  enabledField: css`
    display: flex;
    align-items: flex-start;
    margin-bottom: ${theme.spacing.md};
  `,
  enabledCheckbox: css`
    margin-right: ${theme.spacing.sm};
    display: flex;
  `,
  breakLine: css`
    margin-top: ${theme.spacing.lg};
  `,
  submissionError: css`
    margin-top: ${theme.spacing.md};
  `,
});

export const CheckEditor = ({ check, onReturn }: Props) => {
  const {
    instance: { api },
  } = useContext(InstanceContext);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const styles = useStyles(getStyles);
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const formMethods = useForm<CheckFormValues>({ defaultValues, mode: 'onChange' });
  const selectedCheckType = formMethods.watch('checkType').value ?? CheckType.PING;

  const isEditor = hasRole(OrgRole.EDITOR);

  const { execute: onSubmit, error, loading: submitting } = useAsyncCallback(async (checkValues: CheckFormValues) => {
    const updatedCheck = getCheckFromFormValues(checkValues, defaultValues);
    if (check?.id) {
      trackEvent('editCheckSubmit');
      await api?.updateCheck({
        id: check.id,
        tenantId: check.tenantId,
        ...updatedCheck,
      });
    } else {
      trackEvent('addNewCheckSubmit');
      await api?.addCheck(updatedCheck);
    }
    onReturn(true);
  });

  const submissionError = error as SubmissionError;
  if (error) {
    trackException(`addNewCheckSubmitException: ${error}`);
  }

  const onRemoveCheck = async () => {
    const id = check?.id;
    if (!id) {
      return;
    }
    await api?.deleteCheck(id);
    onReturn(true);
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)}>
        <Legend>{check?.id ? 'Edit Check' : 'Add Check'}</Legend>
        <div className={styles.formBody}>
          <Subheader>Check Details</Subheader>
          <Field label="Check type" disabled={check?.id ? true : false}>
            <Controller
              name="checkType"
              control={formMethods.control}
              render={({ field }) => (
                <Select {...field} placeholder="Check type" options={CHECK_TYPE_OPTIONS} width={30} />
              )}
            />
          </Field>
          <HorizontalCheckboxField
            disabled={!isEditor}
            name="enabled"
            id="check-form-enabled"
            label="Enabled"
            description="If a check is enabled, metrics and logs are published to your Grafana Cloud stack."
          />
          <Field
            label="Job name"
            description="Name used for job label"
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
              validate: (target) => validateTarget(selectedCheckType, target),
            }}
            render={({ field }) => (
              <CheckTarget
                {...field}
                typeOfCheck={selectedCheckType}
                invalid={Boolean(formMethods.formState.errors.target)}
                error={formMethods.formState.errors.target?.message}
                disabled={!isEditor}
              />
            )}
          />
          <hr className={styles.breakLine} />
          <ProbeOptions
            isEditor={isEditor}
            timeout={check?.timeout ?? fallbackCheck.timeout}
            frequency={check?.frequency ?? fallbackCheck.frequency}
            probes={check?.probes ?? fallbackCheck.probes}
          />
          <HorizontalCheckboxField
            id="useFullMetrics"
            name="useFullMetrics"
            label="Publish full set of metrics"
            description={'Metrics are reduced by default'}
          />
          <CheckUsage />
          <CheckSettings typeOfCheck={selectedCheckType} isEditor={isEditor} />
          <CheckFormAlert />
        </div>
        <HorizontalGroup>
          <Button type="submit" disabled={formMethods.formState.isSubmitting || submitting}>
            Save
          </Button>
          {check?.id && (
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)} disabled={!isEditor} type="button">
              Delete Check
            </Button>
          )}
          <ConfirmModal
            isOpen={showDeleteModal}
            title="Delete check"
            body="Are you sure you want to delete this check?"
            confirmText="Delete check"
            onConfirm={onRemoveCheck}
            onDismiss={() => setShowDeleteModal(false)}
          />
          <a onClick={() => onReturn(true)}>Back</a>
        </HorizontalGroup>
        {submissionError && (
          <div className={styles.submissionError}>
            <Alert title="Save failed" severity="error">
              {`${submissionError.status}: ${submissionError.message ?? submissionError.msg ?? 'Something went wrong'}`}
            </Alert>
          </div>
        )}
      </form>
    </FormProvider>
  );
};
