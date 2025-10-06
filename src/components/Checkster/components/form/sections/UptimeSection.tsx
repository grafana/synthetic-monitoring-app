import React, { ComponentType } from 'react';

import { FormSectionName } from '../../../types';
import { CheckType } from 'types';

import { useChecksterContext } from '../../../contexts/ChecksterContext';
import { FormSection } from '../FormSection';
import { BrowserUptimeContent } from '../layouts/BrowserUptimeContent';
import { DnsUptimeContent } from '../layouts/DnsUptimeContent';
import { GrpcUptimeContent } from '../layouts/GrpcUptimeContent';
import { HttpUptimeContent } from '../layouts/HttpUptimeContent';
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

export function UptimeSection() {
  const {
    checkMeta: { type },
  } = useChecksterContext();

  const SectionComponent = checkTypeLayoutMap[type] ?? null;

  return (
    <FormSection sectionName={FormSectionName.Uptime}>
      <SectionComponent data-checkType={type} />
    </FormSection>
  );
}
