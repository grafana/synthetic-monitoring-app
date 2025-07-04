import React, { PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { SubmitErrorHandler, SubmitHandler, useFormContext } from 'react-hook-form';
import { Alert, Stack } from '@grafana/ui';

import { Check, CheckFormValues, CheckType, FeatureName } from 'types';
import { AdHocCheckResponse } from 'datasource/responses.types';
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

import { AdHocCheckButton, ConstructActionsProps } from './AdHocCheckButton';
import { AlertsPerCheckSection } from './AlertsPerCheckSection';
import { useCheckForm, useCheckTypeFormLayout } from './CheckForm.hooks';
import { checkHasChanges } from './CheckForm.utils';
import { CheckFormContext, CheckFormContextProvider, useCheckFormMetaContext } from './CheckFormContext';
import { FormLayout } from './FormLayout';

const checkTypeStep1Label = {
  [CheckType.DNS]: `Request`,
  [CheckType.HTTP]: `Request`,
  [CheckType.MULTI_HTTP]: `Requests`,
  [CheckType.Scripted]: `Script`,
  [CheckType.PING]: `Request`,
  [CheckType.TCP]: `Request`,
  [CheckType.Traceroute]: `Request`,
  [CheckType.GRPC]: `Request`,
  [CheckType.Browser]: `Script`,
};

interface CheckFormProps extends PropsWithChildren {
  check?: Check;
  disabled?: boolean;
}

export function CheckForm({ check, disabled }: CheckFormProps) {
  // If the context is not available, we create a new one.
  // This allows the CheckForm to be used both as a standalone component and within the CheckFormContextProvider.
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
    isDisabled,
    schema,
    checkType,
    checkTypeGroup,
    defaultFormValues,
    checkTypeStatus,
  } = useCheckFormMetaContext();

  const isExistingCheck = getIsExistingCheck(check);
  const [openTestCheckModal, setOpenTestCheckModal] = useState(false);
  const [adhocTestData, setAdhocTestData] = useState<AdHocCheckResponse>();

  const formMethods = useFormContext<CheckFormValues>();

  const { error, handleInvalid, handleValid, submittingToApi, testButtonRef, testCheckError, testCheckPending } =
    useCheckForm({
      check,
      checkType,
      checkState,
      onTestSuccess: (data) => {
        setAdhocTestData(data);
        setOpenTestCheckModal(true);
      },
    });

  const {
    checkFields,
    uptimeFields,
    probesFields,
    labelsFields,
    CheckComponent,
    UptimeComponent,
    ProbesComponent,
    LabelsComponent,
  } = useCheckTypeFormLayout(checkType);

  const handleSubmit = (onValid: SubmitHandler<CheckFormValues>, onInvalid: SubmitErrorHandler<CheckFormValues>) =>
    formMethods.handleSubmit(onValid, onInvalid);

  const closeModal = useCallback(() => {
    setOpenTestCheckModal(false);
  }, []);

  const actions = constructActions({
    checkType,
    disabled: isDisabled,
    loading: testCheckPending,
    ref: testButtonRef,
  });

  const alerts = (error || testCheckError) && (
    <Stack direction={`column`}>
      {error && (
        <Alert title="Save failed" severity="error">
          {error.message}
        </Alert>
      )}
      {testCheckError && (
        <Alert title="Test failed" severity="error">
          {testCheckError.message}
        </Alert>
      )}
    </Stack>
  );

  const formValues = formMethods.getValues();

  // @todo Ideally, we dont submit the form when running ad-hoc check and instead use `isDirty`
  const isFormModified = useMemo(() => {
    return checkHasChanges(defaultFormValues, formValues);
  }, [defaultFormValues, formValues]);

  const hasUnsavedChanges = error ? true : isFormModified && !submittingToApi;

  const isAlertsPerCheckOn = useFeatureFlag(FeatureName.AlertsPerCheck).isEnabled;

  return (
    <>
      <FormLayout<CheckFormValues>
        actions={actions}
        alerts={alerts}
        checkState={checkState}
        checkType={checkType}
        onSubmit={handleSubmit}
        onValid={handleValid}
        onInvalid={handleInvalid}
        schema={schema}
        hasUnsavedChanges={hasUnsavedChanges}
      >
        {!isExistingCheck && <OverLimitAlert checkType={checkType} />}

        <FormLayout.Section
          label={checkTypeStep1Label[checkType]}
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
        <FormLayout.Section label="Uptime" fields={uptimeFields} status={checkTypeStatus}>
          {UptimeComponent}
        </FormLayout.Section>
        <FormLayout.Section label="Labels" fields={[`labels`, ...labelsFields]} status={checkTypeStatus}>
          {LabelsComponent}
          <LabelField labelDestination="check" />
        </FormLayout.Section>

        {!isAlertsPerCheckOn && (
          <FormLayout.Section label="Alerting" fields={[`alerts`, `alertSensitivity`]} status={checkTypeStatus}>
            <CheckFormAlert />
          </FormLayout.Section>
        )}

        <FormLayout.Section
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

        {isAlertsPerCheckOn && (
          <FormLayout.Section label="Alerting" fields={[`alerts`, `alertSensitivity`]} status={checkTypeStatus}>
            <AlertsPerCheckSection />
          </FormLayout.Section>
        )}
      </FormLayout>
      <CheckTestResultsModal isOpen={openTestCheckModal} onDismiss={closeModal} testResponse={adhocTestData} />
      <ConfirmLeavingPage enabled={hasUnsavedChanges} />
    </>
  );
}

function constructActions({ checkType, ...rest }: ConstructActionsProps) {
  return checkType !== CheckType.Traceroute
    ? [
        {
          index: 4,
          element: <AdHocCheckButton {...rest} />,
        },
      ]
    : [];
}
