import React, { useCallback } from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesPing } from 'types';
import { PingRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { PingRequest } from 'components/CheckEditor/FormComponents/PingRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';

const PING_FIELDS: PingRequestFields = {
  target: {
    name: `target`,
  },
  ipVersion: {
    name: `settings.ping.ipVersion`,
  },
  dontFragment: {
    name: `settings.ping.dontFragment`,
  },
};

const CheckPingRequest = () => {
  const { isFormDisabled, supportingContent } = useCheckFormContext();
  const { addRequest } = supportingContent;

  const onTest = useCallback(() => {
    addRequest(PING_FIELDS);
  }, [addRequest]);

  return <PingRequest disabled={isFormDisabled} fields={PING_FIELDS} onTest={onTest} />;
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
        <Timeout />
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
