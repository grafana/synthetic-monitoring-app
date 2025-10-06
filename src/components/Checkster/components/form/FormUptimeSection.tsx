import React from 'react';

import { FormSectionName } from '../../types';
import { CheckType } from 'types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { DnsUptimeSection } from './layouts/DnsUptimeSection';
import { GrpcUptimeSection } from './layouts/GrpcUptimeSection';
import { HttpUptimeSection } from './layouts/HttpUptimeSection';
import { MultiHttpUptimeSections } from './layouts/MultiHttpUptimeSections';
import { PingUptimeSection } from './layouts/PingUptimeSection';
import { ScriptedUptimeSection } from './layouts/ScriptedUptimeSection';
import { TcpUptimeSection } from './layouts/TcpUptimeSection';
import { TracerouteUptimeSection } from './layouts/TracerouteUptimeSection';
import { FormSection } from './FormSection';

export function FormUptimeSection() {
  const {
    checkMeta: { type },
  } = useChecksterContext();

  return (
    <FormSection sectionName={FormSectionName.Uptime}>
      {/* Protocol checks (blackbox exporter)*/}
      {type === CheckType.HTTP && <HttpUptimeSection />}
      {type === CheckType.PING && <PingUptimeSection />}
      {type === CheckType.GRPC && <GrpcUptimeSection />}
      {type === CheckType.DNS && <DnsUptimeSection />}
      {type === CheckType.TCP && <TcpUptimeSection />}
      {type === CheckType.Traceroute && <TracerouteUptimeSection />}
      {/* Scripted checks (k6) */}
      {type === CheckType.MULTI_HTTP && <MultiHttpUptimeSections />}
      {[CheckType.Scripted, CheckType.Browser].includes(type) && <ScriptedUptimeSection />}
    </FormSection>
  );
}
