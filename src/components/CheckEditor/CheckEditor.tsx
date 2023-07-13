import React, { useState, useMemo, useContext } from 'react';
import { css } from '@emotion/css';
import {
  Button,
  ConfirmModal,
  Field,
  Input,
  Legend,
  Alert,
  useStyles2,
  LinkButton,
  HorizontalGroup,
  Select,
  Spinner,
} from '@grafana/ui';
import { useAsyncCallback } from 'react-async-hook';
import {
  Check,
  CheckType,
  CheckFormValues,
  SubmissionErrorWrapper,
  FeatureName,
  CheckPageParams,
  AdHocCheckResponse,
} from 'types';
import { hasRole, checkType as getCheckType } from 'utils';
import {
  getDefaultValuesFromCheck,
  getCheckFromFormValues,
  checkTypeParamToCheckType,
} from './checkFormTransformations';
import { validateJob, validateTarget } from 'validation';
import CheckTarget from 'components/CheckTarget';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';
import { CheckSettings } from './CheckSettings';
import { ProbeOptions } from './ProbeOptions';
import { CHECK_TYPE_OPTIONS, fallbackCheck } from 'components/constants';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { CheckUsage } from '../CheckUsage';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { InstanceContext } from 'contexts/InstanceContext';
import { trackEvent, trackException } from 'analytics';
import { useParams } from 'react-router-dom';
import { PluginPage } from 'components/PluginPage';
import { config } from '@grafana/runtime';
import { CheckTestResultsModal } from 'components/CheckTestResultsModal';
import { FeatureFlag } from 'components/FeatureFlag';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

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
  const [isTestModalOpen, setTestModalOpen] = useState(false);
  const [testResponse, setTestResponse] = useState<AdHocCheckResponse>();
  const [testRequestInFlight, setTestRequestInFlight] = useState(false);
  const styles = useStyles2(getStyles);
  const { isEnabled: tracerouteEnabled } = useFeatureFlag(FeatureName.Traceroute);
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
  const submissionError = error as unknown as SubmissionErrorWrapper;
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
            <FeatureFlag name={FeatureName.MultiHttp}>
              {({ isEnabled }) => {
                return !isEnabled ? (
                  <Field label="Check type" disabled={check?.id ? true : false}>
                    <Controller
                      name="checkType"
                      control={formMethods.control}
                      defaultValue={checkType ?? CheckType.PING}
                      render={({ field }) => {
                        const STANDARD_CHECK_TYPE_OPTIONS = CHECK_TYPE_OPTIONS.filter(
                          ({ value }) => value !== CheckType.MULTI_HTTP
                        );
                        return (
                          <Select
                            {...field}
                            placeholder="Check type"
                            options={
                              tracerouteEnabled
                                ? STANDARD_CHECK_TYPE_OPTIONS
                                : STANDARD_CHECK_TYPE_OPTIONS.filter(({ value }) => value !== CheckType.Traceroute)
                            }
                            width={30}
                            disabled={check?.id ? true : false}
                          />
                        );
                      }}
                    />
                  </Field>
                ) : (
                  <></>
                );
              }}
            </FeatureFlag>
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
              description={'Metrics are reduced by default'}
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
              <FeatureFlag name={FeatureName.AdhocChecks}>
                {({ isEnabled }) => {
                  return isEnabled ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        !formMethods.formState.isValid || checkType === CheckType.Traceroute || testRequestInFlight
                      }
                      onClick={() => {
                        const values = formMethods.getValues();
                        const check = getCheckFromFormValues(values, defaultValues, checkType);
                        setTestRequestInFlight(true);
                        api
                          ?.testCheck(check)
                          .then((resp) => {
                            setTestModalOpen(true);
                            setTestResponse(resp);
                          })
                          .finally(() => {
                            setTestRequestInFlight(false);
                          });
                      }}
                    >
                      {testRequestInFlight ? <Spinner /> : 'Test'}
                    </Button>
                  ) : (
                    <div />
                  );
                }}
              </FeatureFlag>
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

              <LinkButton onClick={() => onReturn(true)} fill="text">
                Back
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
      <CheckTestResultsModal
        isOpen={isTestModalOpen}
        onDismiss={() => {
          setTestModalOpen(false);
          setTestResponse(undefined);
        }}
        testResponse={testResponse}
      />
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
