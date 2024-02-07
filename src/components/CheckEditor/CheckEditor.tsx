import React, { useMemo, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { config, locationService } from '@grafana/runtime';
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
import { css } from '@emotion/css';

import { Check, CheckFormValues, CheckPageParams, CheckType, ROUTES } from 'types';
import { checkType as getCheckType, hasRole } from 'utils';
import { validateJob, validateTarget } from 'validation';
import { useChecks, useCUDChecks } from 'data/useChecks';
import { CheckFormAlert } from 'components/CheckFormAlert';
import CheckTarget from 'components/CheckTarget';
import { CheckTestButton } from 'components/CheckTestButton';
import { fallbackCheck } from 'components/constants';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';

import { CheckUsage } from '../CheckUsage';
import {
  checkTypeParamToCheckType,
  getCheckFromFormValues,
  getDefaultValuesFromCheck,
} from './checkFormTransformations';
import { CheckSettings } from './CheckSettings';
import { ProbeOptions } from './ProbeOptions';

const getStyles = (theme: GrafanaTheme2) => ({
  breakLine: css({
    marginTop: theme.spacing(3),
  }),
  submissionError: css({
    marginTop: theme.spacing(2),
  }),
});

export const CheckEditor = () => {
  const { data: checks } = useChecks();
  const { id, checkType: checkTypeParam } = useParams<CheckPageParams>();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const styles = useStyles2(getStyles);
  // If we're editing, grab the appropriate check from the list
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

  const { updateCheck, createCheck, deleteCheck, error, submitting } = useCUDChecks({ eventInfo: { checkType } });

  const isEditor = hasRole(OrgRole.Editor);
  const onSuccess = () => locationService.getHistory().goBack();

  const onSubmit = (checkValues: CheckFormValues) => {
    const toSubmit = getCheckFromFormValues(checkValues, defaultValues, checkType);

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

  const onDelete = () => {
    deleteCheck(check, { onSuccess });
  };

  const capitalizedCheckType = checkType.slice(0, 1).toUpperCase().concat(checkType.split('').slice(1).join(''));
  const headerText = check?.id ? `Editing ${check.job}` : `Add ${capitalizedCheckType} check`;

  return (
    <PluginPage pageNav={{ text: check?.job ? `Editing ${check.job}` : headerText }}>
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

              <LinkButton href={getRoute(ROUTES.Checks)} fill="text" variant="secondary">
                Cancel
              </LinkButton>
            </HorizontalGroup>
          </form>
        </FormProvider>
      </>
      {error && (
        <div className={styles.submissionError}>
          <Alert title="Save failed" severity="error">
            {error.message ?? 'Something went wrong'}
          </Alert>
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete check"
        body="Are you sure you want to delete this check?"
        confirmText="Delete check"
        onConfirm={onDelete}
        onDismiss={() => setShowDeleteModal(false)}
      />
    </PluginPage>
  );
};
