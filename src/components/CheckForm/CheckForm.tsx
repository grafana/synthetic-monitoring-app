import React, { PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { SubmitErrorHandler, SubmitHandler, useFormContext } from 'react-hook-form';
import { Alert, Box, Stack, useSplitter, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { Check, CheckFormValues, CheckType, FeatureName } from 'types';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ChooseCheckType } from 'components/CheckEditor/FormComponents/ChooseCheckType';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckSidePanelView } from 'components/CheckSidePanel/CheckSidePanelView';
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
    initialSection,
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
  const isCheckSidePanelEnabled = useFeatureFlag(FeatureName.CheckSidePanel).isEnabled;
  const styles = useStyles2(getCheckFormStyles);

  const sidePanelStyles = useStyles2(getSidePanelFormStyles);
  const {
    containerProps: { className: containerClassName, ...containerProps },
    primaryProps,
    secondaryProps,
    splitterProps,
  } = useSplitter({
    direction: 'row',
    initialSize: 1,
    dragPosition: 'end',
  });

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



  const renderFormLayout = ({ actions: formActions }: { actions: typeof actions }) => (
    <FormLayout<CheckFormValues>
      actions={formActions}
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
  );

  if (isCheckSidePanelEnabled) {
    return (
      <>
        <div {...containerProps} className={cx(containerClassName, styles.container)}>
          <div {...primaryProps} className={styles.primarySection}>
            <Box grow={1} padding={2} backgroundColor="primary">
              <div className={sidePanelStyles.wrapper}>{renderFormLayout({ actions: [] })}</div>
            </Box>
          </div>
          <div {...splitterProps} />
          <div {...secondaryProps}>
            <CheckSidePanelView />
          </div>
        </div>
        <ConfirmLeavingPage enabled={hasUnsavedChanges} />
      </>
    );
  }

  return (
    <>
      {renderFormLayout({ actions })}
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

const getCheckFormStyles = (theme: any) => ({
  container: css`
    container-type: inline-size;
    background-color: ${theme.colors.background.primary};
    height: 100%;
    overflow: hidden;
    flex: 1 1 0;
  `,
  primarySection: css`
    height: 100%;
    overflow: auto;
  `,
});

const getSidePanelFormStyles = (theme: any) => ({
  wrapper: css`
    height: 100%;
    min-width: 0;

    /* Single column layout with horizontal steps at top */
    & > div > div:first-child {
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
      height: 100%;
      gap: ${theme.spacing(2)};
    }

    /* Horizontal form navigation */
    & ol[data-testid='form-sidebar'] {
      display: flex;
      align-items: center;
      border-right: none;
      border-bottom: 1px solid ${theme.colors.border.medium};
      padding: ${theme.spacing(1)} 0;
      margin: 0;
      list-style-type: none;
      overflow-x: auto;
    }

    /* Step dividers */
    & ol[data-testid='form-sidebar'] > div {
      border-bottom: 2px solid ${theme.colors.border.medium};
      margin: 0 ${theme.spacing(0.5)};
      width: ${theme.spacing(2)};
      border-left: none;
      height: auto;
    }
  `,
});
