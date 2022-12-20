import React, { useState, useMemo, useContext } from 'react';
import { css } from '@emotion/css';
import {
  Button,
  ConfirmModal,
  Field,
  Input,
  Select,
  Legend,
  Alert,
  useStyles,
  LinkButton,
  HorizontalGroup,
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
import { hasRole } from 'utils';
import { getDefaultValuesFromCheck, getCheckFromFormValues } from './checkFormTransformations';
import { validateJob, validateTarget /** validateMultiHttp*/ } from 'validation';
import CheckTarget from 'components/CheckTarget';
import { Subheader } from 'components/Subheader';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';
import { CheckSettings } from './CheckSettings';
import { ProbeOptions } from './ProbeOptions';
import { CHECK_TYPE_OPTIONS, fallbackCheck } from 'components/constants';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { GrafanaTheme, OrgRole } from '@grafana/data';
import { CheckUsage } from '../CheckUsage';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { InstanceContext } from 'contexts/InstanceContext';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { trackEvent, trackException } from 'analytics';
import { useParams } from 'react-router-dom';
import { PluginPage } from 'components/PluginPage';
import { config } from '@grafana/runtime';
import { CheckTestResultsModal } from 'components/CheckTestResultsModal';
import { MultiHttpSettingsForm } from 'components/MultiHttp/MultiHttpSettingsForm';
import { FeatureFlag } from 'components/FeatureFlag';

interface Props {
  checks?: Check[];
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
  buttonGroup: css`
    gap: ${theme.spacing.sm};
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
  const styles = useStyles(getStyles);

  // If we're editing, grab the appropriate check from the list
  const { id } = useParams<CheckPageParams>();
  let check: Check = fallbackCheck;
  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheck;
  }

  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const { isEnabled: tracerouteEnabled } = useFeatureFlag(FeatureName.Traceroute);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);
  const formMethods = useForm<CheckFormValues>({ defaultValues, mode: 'onChange' });
  const selectedCheckType = formMethods.watch('checkType')?.value ?? CheckType.PING;
  const isEditor = hasRole(OrgRole.Editor);
  const {
    execute: onSubmit,
    error,
    loading: submitting,
  } = useAsyncCallback(async (checkValues: CheckFormValues) => {
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

  // const onSetSubmittedMultiModalValues = (evt: any) => {
  //   // evt.preventDefault();
  //   setSubmittedMultiModalValues(evt);
  //   console.log('submittedMultiModalValues', evt);
  // };

  return (
    <PluginPage pageNav={{ text: check?.job ? check.job : 'Add check', description: 'Check configuration' }}>
      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)}>
          {!config.featureToggles.topnav && <Legend>{check?.id ? 'Edit Check' : 'Add Check'}</Legend>}
          <Subheader>Check Details</Subheader>
          <Field label="Check type" disabled={check?.id ? true : false}>
            <Controller
              name="checkType"
              control={formMethods.control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Check type"
                  options={
                    !tracerouteEnabled
                      ? CHECK_TYPE_OPTIONS.filter(({ value }) => value !== CheckType.Traceroute)
                      : !multiHttpEnabled
                      ? CHECK_TYPE_OPTIONS.filter(({ value }) => value !== CheckType.MULTI_HTTP)
                      : CHECK_TYPE_OPTIONS
                  }
                  width={30}
                  disabled={check?.id ? true : false}
                />
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

          {/* As a start to greater flexibility and to use alternatives to 
              blackbox exporter, we'll use different form values going forward.
              Here, the standard form vals; the second form includes K6-compatible fields
            */}
          {selectedCheckType !== CheckType.MULTI_HTTP ? (
            <>
              {/* Standard Form */}
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
                    // We have to get refetch the check type value from form state in the validation because the value will be stale if we rely on the the .watch method in the render
                    const targetFormValue = formMethods.getValues().checkType;
                    const selectedCheckType = targetFormValue.value as CheckType;
                    return validateTarget(selectedCheckType, target);
                  },
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
                name="publishAdvancedMetrics"
                id="publishAdvancedMetrics"
                label="Publish full set of metrics"
                description={'Metrics are reduced by default'}
              />
              <CheckUsage />
              <CheckSettings typeOfCheck={selectedCheckType} isEditor={isEditor} />
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
                          !formMethods.formState.isValid ||
                          formMethods.getValues().checkType.value === CheckType.Traceroute ||
                          testRequestInFlight
                        }
                        onClick={() => {
                          const values = formMethods.getValues();
                          const check = getCheckFromFormValues(values, defaultValues);
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
              {/* End Standard Form */}
            </>
          ) : (
            <>
              {/* Begin K6 MultiHttp Form */}
              <MultiHttpSettingsForm isEditor={isEditor} onReturn={onReturn} />
              {/* End K6 MultiHttp Form */}
            </>
          )}
        </form>
      </FormProvider>
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
