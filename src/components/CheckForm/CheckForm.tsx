import React, { PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import { SubmitErrorHandler, SubmitHandler, useFormContext } from 'react-hook-form';
import { Alert, Stack } from '@grafana/ui';

import { Check, CheckFormValues, FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ChooseCheckType } from 'components/CheckEditor/FormComponents/ChooseCheckType';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckTestResultsModal } from 'components/CheckTestResultsModal';
import { CheckUsage } from 'components/CheckUsage';
import { ConfirmLeavingPage } from 'components/ConfirmLeavingPage';
import { LabelField } from 'components/LabelField';
import { OverLimitAlert } from 'components/OverLimitAlert';

import { useCheckFormContext } from './CheckFormContext/CheckFormContext';
import { AlertsPerCheckSection } from './AlertsPerCheckSection';
import { useCheckForm, useCheckTypeFormLayout } from './CheckForm.hooks';
import { checkHasChanges, getStep1Label } from './CheckForm.utils';
import { CheckFormContext, CheckFormContextProvider } from './CheckFormContext';
import { FormSectionIndex } from './constants';
import { FormLayout } from './FormLayout';

interface CheckFormProps extends PropsWithChildren {
  check?: Check;
  disabled?: boolean;
}

/**
 * CheckForm with conditional CheckFormContextProvider
 */
export function CheckForm({ check, disabled }: CheckFormProps) {
  const context = useContext(CheckFormContext);
  if (!context) {
    return (
      <CheckFormContextProvider check={check} disabled={disabled}>
        <CheckFormInternal />
      </CheckFormContextProvider>
    );
  }

  return <CheckFormInternal />;
}

function CheckFormInternal() {
  const {
    check,
    checkState,
    getIsExistingCheck,
    initialSection,
    schema,
    checkType,
    checkTypeGroup,
    defaultFormValues,
    checkTypeStatus,
    adhocTestData,
    setShowAdhocTestModal,
    showAdhocTestModal,
    adhocTestError,
  } = useCheckFormContext();

  const isExistingCheck = getIsExistingCheck(check);

  const formMethods = useFormContext<CheckFormValues>();

  const { error, handleInvalid, handleValid, submittingToApi } = useCheckForm({
    check,
    checkType,
  });

  const {
    checkFields,
    uptimeFields,
    probesFields,
    labelsFields,
    alertsFields,
    CheckComponent,
    UptimeComponent,
    ProbesComponent,
    LabelsComponent,
  } = useCheckTypeFormLayout(checkType);

  const handleSubmit = (onValid: SubmitHandler<CheckFormValues>, onInvalid: SubmitErrorHandler<CheckFormValues>) =>
    formMethods.handleSubmit(onValid, onInvalid);

  const closeModal = useCallback(() => {
    setShowAdhocTestModal(false);
  }, [setShowAdhocTestModal]);

  const formValues = formMethods.getValues();

  const alerts = (error || adhocTestError) && (
    <Stack direction={`column`}>
      {error && (
        <Alert title="Save failed" severity="error">
          {error.message}
        </Alert>
      )}
      {adhocTestError && (
        <Alert title="Test failed" severity="error">
          {adhocTestError.message}
        </Alert>
      )}
    </Stack>
  );

  // @todo Ideally, we dont submit the form when running ad-hoc check and instead use `isDirty`
  const isFormModified = useMemo(() => {
    return checkHasChanges(defaultFormValues, formValues);
  }, [defaultFormValues, formValues]);

  const hasUnsavedChanges = error ? true : isFormModified && !submittingToApi;

  const isAlertsPerCheckOn = useFeatureFlag(FeatureName.AlertsPerCheck).isEnabled;

  return (
    <>
      <FormLayout<CheckFormValues>
        alerts={alerts}
        checkState={checkState}
        checkType={checkType}
        initialSection={initialSection}
        onSubmit={handleSubmit}
        onValid={handleValid}
        onInvalid={handleInvalid}
        schema={schema}
        hasUnsavedChanges={hasUnsavedChanges}
      >
        {!isExistingCheck && <OverLimitAlert checkType={checkType} />}

        <FormLayout.Section
          index={FormSectionIndex.Check}
          label={getStep1Label(checkType)}
          fields={[`job`, ...checkFields]}
          status={checkTypeStatus}
        >
          <Stack direction={`column`} gap={4}>
            <CheckJobName />
            <Stack direction={`column`} gap={2}>
              <ChooseCheckType checkType={checkType} checkTypeGroup={checkTypeGroup} disabled={isExistingCheck} />
              {CheckComponent}
            </Stack>
          </Stack>
        </FormLayout.Section>

        <FormLayout.Section
          index={FormSectionIndex.Uptime}
          label="Uptime"
          fields={uptimeFields}
          status={checkTypeStatus}
        >
          {UptimeComponent}
        </FormLayout.Section>

        <FormLayout.Section
          index={FormSectionIndex.Labels}
          label="Labels"
          fields={[`labels`, ...labelsFields]}
          status={checkTypeStatus}
        >
          {LabelsComponent}
          <LabelField labelDestination="check" />
        </FormLayout.Section>

        <FormLayout.Section
          index={FormSectionIndex.Execution}
          label="Execution"
          fields={[`probes`, `frequency`, ...probesFields]}
          status={checkTypeStatus}
        >
          <Stack direction={`column`} gap={4}>
            <ProbeOptions checkType={checkType} />
            {ProbesComponent}
            <CheckUsage checkType={checkType} />
          </Stack>
        </FormLayout.Section>

        <FormLayout.Section
          index={FormSectionIndex.Alerting}
          label="Alerting"
          fields={alertsFields}
          status={checkTypeStatus}
        >
          {isAlertsPerCheckOn ? <AlertsPerCheckSection /> : <CheckFormAlert />}
        </FormLayout.Section>
      </FormLayout>
      <CheckTestResultsModal isOpen={showAdhocTestModal} onDismiss={closeModal} testResponse={adhocTestData} />
      <ConfirmLeavingPage enabled={hasUnsavedChanges} />
    </>
  );
}
