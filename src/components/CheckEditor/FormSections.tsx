import React from 'react';
import { Stack } from '@grafana/ui';

import { FeatureName } from '../../types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

import { AlertsPerCheckSection } from '../CheckForm/AlertsPerCheckSection';
import { CheckFormAlert } from '../CheckFormAlert';
import { CheckUsage } from '../CheckUsage';
import { LabelField } from '../LabelField';
import { CheckJobName } from './FormComponents/CheckJobName';
import { ChooseCheckType } from './FormComponents/ChooseCheckType';
import { useCheckTypeFormLayout, useSectionIndexMap } from './CheckEditor.hooks';
import { getStep1Label } from './CheckEditor.utils';
import { useCheckEditorContext } from './CheckEditorContext';
import { FormSection } from './FormSection';
import { ProbeOptions } from './ProbeOptions';

export function FormSections() {
  const sectionIndexMap = useSectionIndexMap();
  const {
    checkMeta: { check, getIsExistingCheck, checkType, checkTypeGroup, checkTypeStatus },
  } = useCheckEditorContext();

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

  const isAlertsPerCheckOn = useFeatureFlag(FeatureName.AlertsPerCheck).isEnabled;
  const isExistingCheck = getIsExistingCheck(check);

  return (
    <>
      <FormSection
        index={sectionIndexMap.job}
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
      </FormSection>

      <FormSection index={sectionIndexMap.uptime} label="Uptime" fields={uptimeFields} status={checkTypeStatus}>
        {UptimeComponent}
      </FormSection>

      <FormSection
        index={sectionIndexMap.labels}
        label="Labels"
        fields={[`labels`, ...labelsFields]}
        status={checkTypeStatus}
      >
        {LabelsComponent}
        <LabelField labelDestination="check" />
      </FormSection>

      <FormSection
        index={sectionIndexMap.execution}
        label="Execution"
        fields={[`probes`, `frequency`, ...probesFields]}
        status={checkTypeStatus}
      >
        <Stack direction={`column`} gap={4}>
          <ProbeOptions checkType={checkType} />
          {ProbesComponent}
          <CheckUsage checkType={checkType} />
        </Stack>
      </FormSection>

      <FormSection index={sectionIndexMap.alerting} label="Alerting" fields={alertsFields} status={checkTypeStatus}>
        {isAlertsPerCheckOn ? <AlertsPerCheckSection /> : <CheckFormAlert />}
      </FormSection>
    </>
  );
}
