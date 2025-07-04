import React from 'react';
import { useFormContext } from 'react-hook-form';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesDns, CheckType } from 'types';
import { useNestedRequestErrors } from 'hooks/useNestedRequestErrors';
import { DNSRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { DNSCheckResponseMatches } from 'components/CheckEditor/FormComponents/DNSCheckResponseMatches';
import { DNSCheckValidResponseCodes } from 'components/CheckEditor/FormComponents/DNSCheckValidResponseCodes';
import { DNSRequest } from 'components/CheckEditor/FormComponents/DNSRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

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
  const { handleErrorRef } = useNestedRequestErrors(DNS_REQUEST_FIELDS);
  const {
    formState: { disabled: isFormDisabled },
  } = useFormContext();

  return <DNSRequest disabled={isFormDisabled} fields={DNS_REQUEST_FIELDS} ref={handleErrorRef} />;
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
        <Timeout checkType={CheckType.DNS} />
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
