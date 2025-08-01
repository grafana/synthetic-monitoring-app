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
import { checkHasChanges, getStep1Label } from './CheckForm.utils';
import { CheckFormContext, CheckFormContextProvider, useCheckFormMetaContext } from './CheckFormContext';
import { FormStepOrder } from './constants';
import { FormLayout } from './FormLayout';

interface CheckFormProps extends PropsWithChildren {
  check?: Check;
  disabled?: boolean;
}

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
    alertsFields,
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

  // @todo Remove this
  const [, setActiveSection] = useState<number>(0);

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
        onSectionClick={setActiveSection}
      >
        {!isExistingCheck && <OverLimitAlert checkType={checkType} />}

        <FormLayout.Section
          index={FormStepOrder.Check}
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

        <FormLayout.Section index={FormStepOrder.Uptime} label="Uptime" fields={uptimeFields} status={checkTypeStatus}>
          {UptimeComponent}
        </FormLayout.Section>

        <FormLayout.Section
          index={FormStepOrder.Labels}
          label="Labels"
          fields={[`labels`, ...labelsFields]}
          status={checkTypeStatus}
        >
          {LabelsComponent}
          <LabelField labelDestination="check" />
        </FormLayout.Section>

        <FormLayout.Section
          index={FormStepOrder.Execution}
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
          index={FormStepOrder.Alerting}
          label="Alerting"
          fields={alertsFields}
          status={checkTypeStatus}
        >
          {isAlertsPerCheckOn ? <AlertsPerCheckSection /> : <CheckFormAlert />}
        </FormLayout.Section>
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
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          element: <AdHocCheckButton {...rest} />,
        },
      ]
    : [];
}
