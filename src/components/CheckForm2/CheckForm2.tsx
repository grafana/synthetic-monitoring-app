import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Check,
  CheckFormValues,
  CheckFormValuesDns,
  CheckFormValuesGRPC,
  CheckFormValuesHttp,
  CheckFormValuesMultiHttp,
  CheckFormValuesPing,
  CheckFormValuesScripted,
  CheckFormValuesTcp,
  CheckFormValuesTraceroute,
  CheckPageParams,
  CheckType,
} from 'types';
import { useChecks } from 'data/useChecks';
import { toFormValues } from 'components/CheckEditor/checkFormTransformations';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
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
import { LayoutSection, Section } from 'components/CheckForm/FormLayouts/Layout.types';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { fallbackCheckMap } from 'components/constants';
import { LabelField } from 'components/LabelField';
import { PluginPage } from 'components/PluginPage';

import { FormLayoutContextProvider } from './FormLayout/formLayoutContextProvider';
import { SubSectionContent } from './CheckFieldsSubSection';
import { useCheckFormSchema } from './checkForm.hooks';
import { FormLayout2 } from './FormLayout';
import { useFormCheckType } from './useCheckType';

type CheckForm2Props = {
  check?: Check;
};

export const CheckForm2 = () => {
  const { data: checks } = useChecks();
  const { id } = useParams<CheckPageParams>();

  if (id && !checks) {
    return null;
  }

  const check = checks?.find((c) => c.id === Number(id));

  if (!check && id) {
    return `Can't find check`;
  }

  return <CheckForm2Content check={check} />;
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

type CheckTypeMap = {
  [CheckType.DNS]: CheckFormValuesDns;
  [CheckType.HTTP]: CheckFormValuesHttp;
  [CheckType.MULTI_HTTP]: CheckFormValuesMultiHttp;
  [CheckType.Scripted]: CheckFormValuesScripted;
  [CheckType.PING]: CheckFormValuesPing;
  [CheckType.TCP]: CheckFormValuesTcp;
  [CheckType.Traceroute]: CheckFormValuesTraceroute;
  [CheckType.GRPC]: CheckFormValuesGRPC;
};

const checkTypeStep1Label = {
  [CheckType.DNS]: `Request`,
  [CheckType.HTTP]: `Request`,
  [CheckType.MULTI_HTTP]: `Steps`,
  [CheckType.Scripted]: `Script`,
  [CheckType.PING]: `Request`,
  [CheckType.TCP]: `Request`,
  [CheckType.Traceroute]: `Request`,
  [CheckType.GRPC]: `Request`,
};

export const CheckForm2Content = ({ check }: CheckForm2Props) => {
  const checkType = useFormCheckType();
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

  // @ts-expect-error
  const layout: Record<LayoutSection, Array<Section<CheckTypeMap[typeof checkType]>>> = layoutMap[checkType];

  const defineCheckSection = layout[LayoutSection.Check] || [];
  const defineCheckFields = defineCheckSection.map((section) => section.fields).flat();

  const defineUptimeSection = layout[LayoutSection.Uptime] || [];
  const defineUptimeFields = defineUptimeSection.map((section) => section.fields).flat();

  const probesSection = layout[LayoutSection.Probes] || [];
  const probesFields = probesSection.map((section) => section.fields).flat();

  const labelsSection = layout[LayoutSection.Labels] || [];
  const labelsFields = probesSection.map((section) => section.fields).flat();

  return (
    <PluginPage pageNav={{ text: `Check Form 2` }}>
      <FormProvider {...formMethods}>
        <FormLayoutContextProvider>
          <div className={styles.wrapper}>
            <FormLayout2>
              <FormLayout2.Section label={checkTypeStep1Label[checkType]} fields={[`job`, ...defineCheckFields]}>
                <div className={styles.stackCol}>
                  <ChooseCheckType />
                  <CheckTarget />
                  <SubSectionContent sections={defineCheckSection} />
                </div>
              </FormLayout2.Section>
              <FormLayout2.Section label="Define uptime" fields={defineUptimeFields}>
                <SubSectionContent sections={defineUptimeSection} />
              </FormLayout2.Section>

              <FormLayout2.Section label="Probes" fields={[`probes`, `frequency`, ...probesFields]}>
                <ProbeOptions checkType={checkType} />
                <SubSectionContent sections={probesSection} />
                <CheckUsage checkType={checkType} />
              </FormLayout2.Section>
              <FormLayout2.Section label="Labels" fields={[`job`, `labels`, ...labelsFields]}>
                <CheckJobName />
                <SubSectionContent sections={labelsSection} />
                <LabelField<CheckFormValuesHttp> labelDestination="check" />
              </FormLayout2.Section>
              <FormLayout2.Section label="Alerting" fields={[`alertSensitivity`]}>
                <CheckFormAlert />
              </FormLayout2.Section>
              <FormLayout2.Section label="Review">Test the form?</FormLayout2.Section>
            </FormLayout2>
          </div>
        </FormLayoutContextProvider>
      </FormProvider>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stackCol: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  wrapper: css({
    paddingTop: theme.spacing(2),
    height: `100%`,
  }),
});
