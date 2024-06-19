import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { zodResolver } from '@hookform/resolvers/zod';

import { Check, CheckFormPageParams, CheckFormValues, CheckPageParams, CheckType } from 'types';
import { useChecks } from 'data/useChecks';
import { CHECK_TYPE_GROUP_OPTIONS } from 'hooks/useCheckTypeGroupOptions';
import { toFormValues } from 'components/CheckEditor/checkFormTransformations';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ChooseCheckType } from 'components/CheckEditor/FormComponents/ChooseCheckType';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
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
import { CheckUsage } from 'components/CheckUsage';
import { fallbackCheckMap } from 'components/constants';
import { LabelField } from 'components/LabelField';
import { PluginPage } from 'components/PluginPage';

import { CheckFormContextProvider } from './CheckFormContext/CheckFormContext';
import { useCheckFormSchema } from './checkForm.hooks';
import { FormLayout } from './FormLayout';
import { useFormCheckType } from './useCheckType';

type CheckForm2Props = {
  check?: Check;
};

export const CheckForm = () => {
  const { data: checks } = useChecks();
  const { id } = useParams<CheckPageParams>();

  if (id && !checks) {
    return null;
  }

  const check = checks?.find((c) => c.id === Number(id));

  if (!check && id) {
    return `Can't find check`;
  }

  return <CheckFormContent check={check} />;
};
const layoutMap = {
  [CheckType.HTTP]: HttpCheckLayout,
  [CheckType.MULTI_HTTP]: MultiHTTPCheckLayout,
  [CheckType.Scripted]: ScriptedCheckLayout,
  [CheckType.PING]: PingCheckLayout,
  [CheckType.DNS]: DNSCheckLayout,
  [CheckType.TCP]: TCPCheckLayout,
  [CheckType.Traceroute]: TracerouteCheckLayout,
  [CheckType.GRPC]: GRPCCheckLayout,
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
};

export const CheckFormContent = ({ check }: CheckForm2Props) => {
  const checkType = useFormCheckType();
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const entry = CHECK_TYPE_GROUP_OPTIONS.find((option) => option.value === checkTypeGroup);
  const initialCheck = check || fallbackCheckMap[checkType];
  const schema = useCheckFormSchema();
  const styles = useStyles2(getStyles);

  const formMethods = useForm<CheckFormValues>({
    defaultValues: toFormValues(initialCheck, checkType),
    shouldFocusError: false, // we manage focus manually
    resolver: zodResolver(schema),
  });
  // console.log(formMethods.watch());
  // console.log(formMethods.formState.errors);

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

  return (
    <PluginPage pageNav={{ text: `New ${entry?.label} check` }}>
      <FormProvider {...formMethods}>
        <CheckFormContextProvider>
          <div className={styles.wrapper}>
            <FormLayout>
              <FormLayout.Section label={checkTypeStep1Label[checkType]} fields={[`job`, ...defineCheckFields]}>
                <Stack direction={`column`} gap={4}>
                  <CheckJobName />
                  <Stack direction={`column`} gap={2}>
                    <ChooseCheckType />
                    {CheckComponent}
                  </Stack>
                </Stack>
              </FormLayout.Section>
              <FormLayout.Section label="Define uptime" fields={defineUptimeFields}>
                {UptimeComponent}
              </FormLayout.Section>
              <FormLayout.Section label="Labels" fields={[`labels`, ...labelsFields]}>
                {labelsComponent}
                <LabelField labelDestination="check" />
              </FormLayout.Section>
              <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
                <CheckFormAlert />
              </FormLayout.Section>
              <FormLayout.Section label="Probes" fields={[`probes`, `frequency`, ...probesFields]}>
                <ProbeOptions checkType={checkType} />
                {ProbesComponent}
                <CheckUsage checkType={checkType} />
              </FormLayout.Section>
            </FormLayout>
          </div>
        </CheckFormContextProvider>
      </FormProvider>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    paddingTop: theme.spacing(2),
    height: `100%`,
  }),
});
