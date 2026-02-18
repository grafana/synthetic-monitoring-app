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

const CHECK_TYPE_LAYOUT_MAP: Record<CheckType, ComponentType> = {
  /* Protocol checks (blackbox exporter)*/
  [CheckType.Http]: HttpUptimeContent,
  [CheckType.Ping]: PingUptimeContent,
  [CheckType.Grpc]: GrpcUptimeContent,
  [CheckType.Dns]: DnsUptimeContent,
  [CheckType.Tcp]: TcpUptimeContent,
  [CheckType.Traceroute]: TracerouteUptimeContent,
  /* Scripted checks (k6) */
  [CheckType.MultiHttp]: MultiHttpUptimeContent,
  [CheckType.Scripted]: ScriptedUptimeContent,
  [CheckType.Browser]: BrowserUptimeContent,
};

const DEFAULT_UPTIME_FIELDS = ['timeout'];

function getCheckTypeFields(checkType: CheckType) {
  switch (checkType) {
    case CheckType.MultiHttp:
      return MULTI_HTTP_UPTIME_FIELDS;
    case CheckType.Http:
      return HTTP_UPTIME_FIELDS;
    default:
      return DEFAULT_UPTIME_FIELDS;
  }
}

export function UptimeSection() {
  const { checkType } = useChecksterContext();

  const SectionComponent = CHECK_TYPE_LAYOUT_MAP[checkType] ?? null;
  const fields = getCheckTypeFields(checkType);

  return (
    <FormSection sectionName={FormSectionName.Uptime} fields={fields}>
      <SectionComponent data-checkType={checkType} />
    </FormSection>
  );
}
