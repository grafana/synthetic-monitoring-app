import React, { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesPing, CheckType } from 'types';
import { useNestedRequestErrors } from 'hooks/useNestedRequestErrors';
import { PingRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { PingRequest } from 'components/CheckEditor/FormComponents/PingRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

import { CheckTimeoutValues } from '../CheckForm.constants';
import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';

const PING_FIELDS: PingRequestFields = {
  target: {
    name: `target`,
  },
  ipVersion: {
    name: `settings.ping.ipVersion`,
    section: 0,
  },
  dontFragment: {
    name: `settings.ping.dontFragment`,
    section: 0,
  },
};

const CheckPingRequest = () => {
  const { isFormDisabled, supportingContent } = useCheckFormContext();
  const { addIndividualRequest } = supportingContent;
  const { handleErrorRef } = useNestedRequestErrors(PING_FIELDS);
  const { getValues } = useFormContext<CheckFormValuesPing>();

  const onTest = useCallback(() => {
    addIndividualRequest(PING_FIELDS, getValues());
  }, [addIndividualRequest, getValues]);

  return <PingRequest disabled={isFormDisabled} fields={PING_FIELDS} onTest={onTest} ref={handleErrorRef} />;
};

export const PingCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesPing>>> = {
  [LayoutSection.Check]: {
    fields: Object.values(PING_FIELDS).map((field) => field.name),
    Component: (
      <>
        <CheckPingRequest />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`timeout`],
    Component: (
      <>
        <Timeout min={CheckTimeoutValues[CheckType.PING].min} max={CheckTimeoutValues[CheckType.PING].max} />
      </>
    ),
  },
  [LayoutSection.Probes]: {
    fields: [`publishAdvancedMetrics`],
    Component: (
      <>
        <CheckPublishedAdvanceMetrics />
      </>
    ),
  },
};
