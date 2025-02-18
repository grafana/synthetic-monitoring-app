import React, { forwardRef, RefObject, useCallback, useMemo, useState } from 'react';
import { FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Button, Stack, Tab, TabContent, TabsBar, Text, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { zodResolver } from '@hookform/resolvers/zod';
import { DataTestIds } from 'test/dataTestIds';

import {
  AlertingType,
  Check,
  CheckAlertFormValues,
  CheckAlertType,
  CheckFormValues,
  CheckType,
  FeatureName,
} from 'types';
import { createNavModel } from 'utils';
import { ROUTES } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { useCheckTypeGroupOption } from 'hooks/useCheckTypeGroupOptions';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useCanReadLogs } from 'hooks/useDSPermission';
import { useLimits } from 'hooks/useLimits';
import { toFormValues } from 'components/CheckEditor/checkFormTransformations';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ChooseCheckType } from 'components/CheckEditor/FormComponents/ChooseCheckType';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { AlertsPerCheck } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck';
import { checkHasChanges } from 'components/CheckForm/checkForm.utils';
import { DNSCheckLayout } from 'components/CheckForm/FormLayouts/CheckDNSLayout';
import { GRPCCheckLayout } from 'components/CheckForm/FormLayouts/CheckGrpcLayout';
import { HttpCheckLayout } from 'components/CheckForm/FormLayouts/CheckHttpLayout';
import { MultiHTTPCheckLayout } from 'components/CheckForm/FormLayouts/CheckMultiHttpLayout';
import { PingCheckLayout } from 'components/CheckForm/FormLayouts/CheckPingLayout';
import { ScriptedCheckLayout } from 'components/CheckForm/FormLayouts/CheckScriptedLayout';
import { TCPCheckLayout } from 'components/CheckForm/FormLayouts/CheckTCPLayout';
import { TracerouteCheckLayout } from 'components/CheckForm/FormLayouts/CheckTracerouteLayout';
import { LayoutSection } from 'components/CheckForm/FormLayouts/Layout.types';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckTestResultsModal } from 'components/CheckTestResultsModal';
import { CheckUsage } from 'components/CheckUsage';
import { ConfirmLeavingPage } from 'components/ConfirmLeavingPage';
import { fallbackCheckMap } from 'components/constants';
import { FeatureFlag } from 'components/FeatureFlag';
import { LabelField } from 'components/LabelField';
import { OverLimitAlert } from 'components/OverLimitAlert';

import { CheckFormContextProvider, useCheckFormContext } from './CheckFormContext/CheckFormContext';
import { BrowserCheckLayout } from './FormLayouts/CheckBrowserLayout';
import { useCheckForm, useCheckFormSchema } from './checkForm.hooks';
import { FormLayout } from './FormLayout';
import { useFormCheckType, useFormCheckTypeGroup } from './useCheckType';

const layoutMap = {
  [CheckType.HTTP]: HttpCheckLayout,
  [CheckType.MULTI_HTTP]: MultiHTTPCheckLayout,
  [CheckType.Scripted]: ScriptedCheckLayout,
  [CheckType.PING]: PingCheckLayout,
  [CheckType.DNS]: DNSCheckLayout,
  [CheckType.TCP]: TCPCheckLayout,
  [CheckType.Traceroute]: TracerouteCheckLayout,
  [CheckType.GRPC]: GRPCCheckLayout,
  [CheckType.Browser]: BrowserCheckLayout,
};

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

type CheckFormProps = {
  check?: Check;
  disabled?: boolean;
};

export const CheckForm = ({ check, disabled }: CheckFormProps) => {
  const { canWriteChecks } = getUserPermissions();
  const canReadLogs = useCanReadLogs();
  const [openTestCheckModal, setOpenTestCheckModal] = useState(false);
  const [adhocTestData, setAdhocTestData] = useState<AdHocCheckResponse>();
  const checkType = useFormCheckType(check);
  const checkTypeGroup = useFormCheckTypeGroup(check);
  const initialCheck = check || fallbackCheckMap[checkType];
  const schema = useCheckFormSchema(check);
  const styles = useStyles2(getStyles);
  const status = useCheckTypeOptions().find((option) => option.value === checkType)?.status;
  const isExistingCheck = !!(check && check?.id !== undefined);
  const { isLoading, isOverBrowserLimit, isOverHgExecutionLimit, isOverCheckLimit, isOverScriptedLimit, isReady } =
    useLimits();
  const overLimit =
    isOverHgExecutionLimit ||
    isOverCheckLimit ||
    (checkType === CheckType.Browser && isOverBrowserLimit) ||
    ([CheckType.MULTI_HTTP, CheckType.Scripted].includes(checkType) && isOverScriptedLimit);
  const isDisabled = disabled || !canWriteChecks || getLimitDisabled({ isExistingCheck, isLoading, overLimit });
  const defaultValues = useMemo(() => toFormValues(initialCheck, checkType), [initialCheck, checkType]);
  const [formDefaultValues, setFormDefaultValues] = useState(defaultValues);

  const formMethods = useForm<CheckFormValues>({
    defaultValues,
    shouldFocusError: false, // we manage focus manually
    resolver: zodResolver(schema),
  });

  const { error, handleInvalid, handleValid, submittingToApi, testButtonRef, testCheckError, testCheckPending } =
    useCheckForm({
      check,
      checkType,
      onTestSuccess: (data) => {
        setAdhocTestData(data);
        setOpenTestCheckModal(true);
      },
    });

  const handleSubmit = (onValid: SubmitHandler<CheckFormValues>, onInvalid: SubmitErrorHandler<CheckFormValues>) =>
    formMethods.handleSubmit(onValid, onInvalid);

  const layout = layoutMap[checkType];

  const defineCheckSection = layout[LayoutSection.Check];
  const defineCheckFields = defineCheckSection?.fields || [];
  const CheckComponent = defineCheckSection?.Component;

  const defineUptimeSection = layout[LayoutSection.Uptime];
  const defineUptimeFields = defineUptimeSection?.fields || [];
  const UptimeComponent = defineUptimeSection?.Component;

  const probesSection = layout[LayoutSection.Probes];
  const probesFields = probesSection?.fields || [];
  const ProbesComponent = probesSection?.Component;

  const labelsSection = layout[LayoutSection.Labels];
  const labelsFields = labelsSection?.fields || [];
  const labelsComponent = labelsSection?.Component;

  const closeModal = useCallback(() => {
    setOpenTestCheckModal(false);
  }, []);

  const actions = constructActions({
    canReadLogs,
    checkType,
    disabled: isDisabled,
    loading: testCheckPending,
    ref: testButtonRef,
  });
  const checkTypeGroupOption = useCheckTypeGroupOption(checkTypeGroup);

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

  const isFormModified = useMemo(() => {
    return checkHasChanges(formDefaultValues, formValues);
  }, [formDefaultValues, formValues]);

  const hasUnsavedChanges = error ? true : isFormModified && !submittingToApi;

  const handleInitAlerts = useCallback(
    (alerts: Partial<Record<CheckAlertType, CheckAlertFormValues>>) => {
      const newDefaults = {
        ...defaultValues,
        alerts: {
          ...defaultValues.alerts,
          ...alerts,
        },
      };
      setFormDefaultValues(newDefaults);
    },
    [defaultValues, setFormDefaultValues]
  );

  const navModel = useMemo(() => {
    return isExistingCheck
      ? createNavModel(
          {
            text: check.job,
            url: generateRoutePath(ROUTES.CheckDashboard, { id: check.id! }),
          },
          [{ text: `Edit` }]
        )
      : createNavModel({ text: `Choose a check type`, url: generateRoutePath(ROUTES.ChooseCheckGroup) }, [
          { text: `${checkTypeGroupOption?.label ?? 'Check not found'}` },
        ]);
  }, [check, checkTypeGroupOption, isExistingCheck]);

  const [selectedAlertingTab, setSelectedAlertingTab] = useState<AlertingType>('alerting');

  return (
    <PluginPage
      pageNav={navModel}
      renderTitle={isExistingCheck ? () => <Text element="h1">{`Editing ${check.job}`}</Text> : undefined}
    >
      <FormProvider {...formMethods}>
        <CheckFormContextProvider disabled={isDisabled}>
          <div className={styles.wrapper} data-testid={isReady ? DataTestIds.PAGE_READY : DataTestIds.PAGE_NOT_READY}>
            <FormLayout
              actions={actions}
              alerts={alerts}
              disabled={isDisabled}
              onSubmit={handleSubmit}
              onValid={handleValid}
              onInvalid={handleInvalid}
              schema={schema}
              hasUnsavedChanges={hasUnsavedChanges}
            >
              {!isExistingCheck && <OverLimitAlert checkType={checkType} />}

              <FormLayout.Section
                label={checkTypeStep1Label[checkType]}
                fields={[`job`, ...defineCheckFields]}
                status={status}
              >
                <Stack direction={`column`} gap={4}>
                  <CheckJobName />
                  <Stack direction={`column`} gap={2}>
                    <ChooseCheckType checkType={checkType} checkTypeGroup={checkTypeGroup} disabled={isExistingCheck} />
                    {CheckComponent}
                  </Stack>
                </Stack>
              </FormLayout.Section>
              <FormLayout.Section label="Define uptime" fields={defineUptimeFields} status={status}>
                {UptimeComponent}
              </FormLayout.Section>
              <FormLayout.Section label="Labels" fields={[`labels`, ...labelsFields]} status={status}>
                {labelsComponent}
                <CheckLabels />
              </FormLayout.Section>
              <FormLayout.Section label="Alerting" fields={[`alerts`, `alertSensitivity`]} status={status}>
                <FeatureFlag name={FeatureName.AlertsPerCheck}>
                  {({ isEnabled }) =>
                    isEnabled ? (
                      <>
                        <TabsBar>
                          <Tab
                            label="Alerts per check"
                            onChangeTab={() => setSelectedAlertingTab('alerting')}
                            active={selectedAlertingTab === 'alerting'}
                          />
                          <Tab
                            label="Legacy Alerting"
                            onChangeTab={() => setSelectedAlertingTab('sensitivity')}
                            active={selectedAlertingTab === 'sensitivity'}
                          />
                        </TabsBar>
                        <TabContent>
                          <div className={styles.wrapper}>
                            {selectedAlertingTab === 'alerting' && <AlertsPerCheck onInitAlerts={handleInitAlerts} />}
                            {selectedAlertingTab === 'sensitivity' && <CheckFormAlert />}
                          </div>
                        </TabContent>{' '}
                      </>
                    ) : (
                      <CheckFormAlert />
                    )
                  }
                </FeatureFlag>
              </FormLayout.Section>
              <FormLayout.Section label="Execution" fields={[`probes`, `frequency`, ...probesFields]} status={status}>
                <CheckProbeOptions checkType={checkType} />
                {ProbesComponent}
                <CheckUsage checkType={checkType} />
              </FormLayout.Section>
            </FormLayout>
          </div>
        </CheckFormContextProvider>
      </FormProvider>
      <CheckTestResultsModal isOpen={openTestCheckModal} onDismiss={closeModal} testResponse={adhocTestData} />
      <ConfirmLeavingPage enabled={hasUnsavedChanges} />
    </PluginPage>
  );
};

const CheckLabels = () => {
  const { isFormDisabled } = useCheckFormContext();

  return <LabelField disabled={isFormDisabled} labelDestination="check" />;
};

const CheckProbeOptions = ({ checkType }: { checkType: CheckType }) => {
  const { isFormDisabled } = useCheckFormContext();

  return <ProbeOptions checkType={checkType} disabled={isFormDisabled} />;
};

interface GetIsDisabledProps {
  isExistingCheck: boolean;
  isLoading: boolean;
  overLimit: boolean;
}

function getLimitDisabled({ isExistingCheck, isLoading, overLimit }: GetIsDisabledProps) {
  if (isExistingCheck) {
    return false;
  }

  return isLoading || overLimit;
}

interface ConstructActionsProps {
  canReadLogs: boolean;
  checkType: CheckType;
  disabled: boolean;
  loading: boolean;
  ref: RefObject<HTMLButtonElement>;
}

function constructActions({ checkType, ...rest }: ConstructActionsProps) {
  return checkType !== CheckType.Traceroute
    ? [
        {
          index: 4,
          element: <TestButton {...rest} />,
        },
      ]
    : [];
}

const TestButton = forwardRef<HTMLButtonElement, Omit<ConstructActionsProps, 'checkType'>>(
  ({ disabled, canReadLogs, loading }, ref) => {
    const content = (
      <Button
        disabled={disabled || !canReadLogs}
        icon={loading ? `fa fa-spinner` : undefined}
        ref={ref}
        type="submit"
        variant={`secondary`}
      >
        Test
      </Button>
    );

    if (!canReadLogs) {
      return (
        <Tooltip content="You need permission to read logs to test checks.">
          <span>{content}</span>
        </Tooltip>
      );
    }

    return content;
  }
);

TestButton.displayName = `TestButton`;

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    paddingTop: theme.spacing(2),
    height: `100%`,
  }),
});
