import React, { useCallback } from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesDns, CheckType } from 'types';
import { useNestedRequestErrors } from 'hooks/useNestedRequestErrors';
import { DNSRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { DNSCheckResponseMatches } from 'components/CheckEditor/FormComponents/DNSCheckResponseMatches';
import { DNSCheckValidResponseCodes } from 'components/CheckEditor/FormComponents/DNSCheckValidResponseCodes';
import { DNSRequest } from 'components/CheckEditor/FormComponents/DNSRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

import { CheckTimeoutValues } from '../CheckForm.constants';
import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';

export const DNS_REQUEST_FIELDS: DNSRequestFields = {
  target: {
    name: `target`,
  },
  ipVersion: {
    name: `settings.dns.ipVersion`,
    section: 0,
  },
  recordType: {
    name: `settings.dns.recordType`,
    section: 1,
  },
  server: {
    name: `settings.dns.server`,
    section: 1,
  },
  protocol: {
    name: `settings.dns.protocol`,
    section: 1,
  },
  port: {
    name: `settings.dns.port`,
    section: 1,
  },
};

const CheckDNSRequest = () => {
  const { isFormDisabled, supportingContent } = useCheckFormContext();
  const { addRequest } = supportingContent;
  const { handleErrorRef } = useNestedRequestErrors(DNS_REQUEST_FIELDS);

  const onTest = useCallback(() => {
    addRequest(DNS_REQUEST_FIELDS);
  }, [addRequest]);

  return <DNSRequest disabled={isFormDisabled} fields={DNS_REQUEST_FIELDS} onTest={onTest} ref={handleErrorRef} />;
};

export const DNSCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesDns>>> = {
  [LayoutSection.Check]: {
    fields: Object.values(DNS_REQUEST_FIELDS).map((field) => field.name),
    Component: (
      <>
        <CheckDNSRequest />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`settings.dns.validRCodes`, `settings.dns.validations`],
    Component: (
      <>
        <DNSCheckValidResponseCodes />
        <DNSCheckResponseMatches />
        <Timeout min={CheckTimeoutValues[CheckType.DNS].min} max={CheckTimeoutValues[CheckType.DNS].max} />
      </>
    ),
  },

  [LayoutSection.Probes]: {
    fields: [],
    Component: (
      <>
        <CheckPublishedAdvanceMetrics />
      </>
    ),
  },
};
