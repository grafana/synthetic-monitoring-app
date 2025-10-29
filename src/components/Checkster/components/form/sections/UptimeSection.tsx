import React, { ComponentType } from 'react';

import { FormSectionName } from '../../../types';
import { CheckType } from 'types';

import { useChecksterContext } from '../../../contexts/ChecksterContext';
import { MULTI_HTTP_UPTIME_FIELDS } from '../FormMultiHttpAssertionsField';
import { FormSection } from '../FormSection';
import { BrowserUptimeContent } from '../layouts/BrowserUptimeContent';
import { DnsUptimeContent } from '../layouts/DnsUptimeContent';
import { GrpcUptimeContent } from '../layouts/GrpcUptimeContent';
import { HTTP_UPTIME_FIELDS, HttpUptimeContent } from '../layouts/HttpUptimeContent';
import { MultiHttpUptimeContent } from '../layouts/MultiHttpUptimeContent';
import { PingUptimeContent } from '../layouts/PingUptimeContent';
import { ScriptedUptimeContent } from '../layouts/ScriptedUptimeContent';
import { TcpUptimeContent } from '../layouts/TcpUptimeContent';
import { TracerouteUptimeContent } from '../layouts/TracerouteUptimeContent';

const checkTypeLayoutMap: Record<CheckType, ComponentType> = {
  /* Protocol checks (blackbox exporter)*/
  [CheckType.HTTP]: HttpUptimeContent,
  [CheckType.PING]: PingUptimeContent,
  [CheckType.GRPC]: GrpcUptimeContent,
  [CheckType.DNS]: DnsUptimeContent,
  [CheckType.TCP]: TcpUptimeContent,
  [CheckType.Traceroute]: TracerouteUptimeContent,
  /* Scripted checks (k6) */
  [CheckType.MULTI_HTTP]: MultiHttpUptimeContent,
  [CheckType.Scripted]: ScriptedUptimeContent,
  [CheckType.Browser]: BrowserUptimeContent,
};

const defaultUptimeFields = ['timeout'];

function getCheckTypeFields(checkType: CheckType) {
  switch (checkType) {
    case CheckType.MULTI_HTTP:
      return MULTI_HTTP_UPTIME_FIELDS;
    case CheckType.HTTP:
      return HTTP_UPTIME_FIELDS;
    default:
      return defaultUptimeFields;
  }
}

export function UptimeSection() {
  const { checkType } = useChecksterContext();

  const SectionComponent = checkTypeLayoutMap[checkType] ?? null;
  const fields = getCheckTypeFields(checkType);

  return (
    <FormSection sectionName={FormSectionName.Uptime} fields={fields}>
      <SectionComponent data-checkType={checkType} />
    </FormSection>
  );
}
