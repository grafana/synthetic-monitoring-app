import React, { FC, useState, useMemo, useContext } from 'react';
import { css } from 'emotion';
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
import { useForm, FormContext, Controller } from 'react-hook-form';
import { GrafanaTheme } from '@grafana/data';
import { CheckUsage } from '../CheckUsage';
import { Alerting } from 'components/Alerting';
import { useAlerts } from 'hooks/useAlerts';
import { InstanceContext } from 'components/InstanceContext';

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

export const CheckEditor: FC<Props> = ({ check, onReturn }) => {
  const {
    instance: { api },
  } = useContext(InstanceContext);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { alertRules, setRulesForCheck, deleteRulesForCheck } = useAlerts(check?.id);
  const styles = useStyles(getStyles);
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);

  const formMethods = useForm<CheckFormValues>({ defaultValues, mode: 'onChange' });
  const selectedCheckType = formMethods.watch('checkType').value as CheckType;

  const isEditor = hasRole(OrgRole.EDITOR);

  const { execute: onSubmit, error, loading: submitting } = useAsyncCallback(
    async ({ alerts, ...checkValues }: CheckFormValues) => {
      const updatedCheck = getCheckFromFormValues(checkValues, defaultValues);
      if (check?.id) {
        await api?.updateCheck({
          id: check.id,
          tenantId: check.tenantId,
          ...updatedCheck,
        });
        if (alerts?.length) {
          await setRulesForCheck(check.id, alerts, checkValues.job, checkValues.target);
        }
      } else {
        const { id } = await api?.addCheck(updatedCheck);
        if (alerts) {
          await setRulesForCheck(id, alerts, checkValues.job, checkValues.target);
        }
      }
      onReturn(true);
    }
  );

  const submissionError = error as SubmissionError;

  const onRemoveCheck = async () => {
    const id = check?.id;
    if (!id) {
      return;
    }
    await api?.deleteCheck(id);
    await deleteRulesForCheck(id);
    onReturn(false);
  };

  const target = formMethods.watch('target', '') as string;

  return (
    <FormContext {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)}>
        <Legend>{check?.id ? 'Edit Check' : 'Add Check'}</Legend>
        <div className={styles.formBody}>
          <Subheader>Check Details</Subheader>
          <Field label="Check type" disabled={check?.id ? true : false}>
            <Controller
              name="checkType"
              placeholder="Check type"
              control={formMethods.control}
              as={Select}
              options={CHECK_TYPE_OPTIONS}
              width={30}
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
            invalid={Boolean(formMethods.errors.job)}
            error={formMethods.errors.job?.message}
          >
            <Input
              id="check-editor-job-input"
              ref={formMethods.register({
                required: true,
                validate: validateJob,
              })}
              name="job"
              type="string"
              placeholder="jobName"
            />
          </Field>

          <Controller
            name="target"
            as={CheckTarget}
            control={formMethods.control}
            target={target}
            valueName="target"
            typeOfCheck={selectedCheckType}
            invalid={Boolean(formMethods.errors.target)}
            error={formMethods.errors.target?.message}
            rules={{
              required: true,
              validate: target => validateTarget(selectedCheckType, target),
            }}
            disabled={!isEditor}
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
          <Alerting alertRules={alertRules} editing={Boolean(check?.id)} checkId={check?.id} />
        </div>
        <HorizontalGroup>
          <Button
            type="submit"
            disabled={formMethods.formState.isSubmitting || submitting || Object.keys(formMethods.errors).length > 0}
          >
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
              {`${submissionError.status}: ${submissionError.message}`}
            </Alert>
          </div>
        )}
      </form>
    </FormContext>
  );
};
