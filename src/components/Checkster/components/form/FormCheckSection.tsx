import React from 'react';

import { FormSectionName } from '../../types';
import { CheckType } from 'types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { DnsCheckSection } from './layouts/DnsCheckSection';
import { GrpcCheckSection } from './layouts/GrpcCheckSection';
import { HttpCheckSection } from './layouts/HttpCheckSection';
import { MultiHttpCheckSections } from './layouts/MultiHttpCheckSections';
import { PingCheckSection } from './layouts/PingCheckSection';
import { TcpCheckSection } from './layouts/TcpCheckSection';
import { TracerouteCheckSection } from './layouts/TracerouteCheckSection';
import { FormSection } from './FormSection';

export function FormCheckSection() {
  const {
    checkMeta: { type },
  } = useChecksterContext();

  // TODO: h2 should be set from this file (preferably)
  return (
    <FormSection sectionName={FormSectionName.Check}>
      {/* Protocol checks (blackbox exporter)*/}
      {type === CheckType.HTTP && <HttpCheckSection />}
      {type === CheckType.PING && <PingCheckSection />}
      {type === CheckType.GRPC && <GrpcCheckSection />}
      {type === CheckType.DNS && <DnsCheckSection />}
      {type === CheckType.TCP && <TcpCheckSection />}
      {type === CheckType.Traceroute && <TracerouteCheckSection />}
      {/* Scripted checks (k6) */}
      {type === CheckType.MULTI_HTTP && <MultiHttpCheckSections />}
    </FormSection>
  );
}
