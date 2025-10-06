import React, { ComponentType } from 'react';

import { FormSectionName } from '../../../types';
import { CheckType } from 'types';

import { useChecksterContext } from '../../../contexts/ChecksterContext';
import { FormSection } from '../FormSection';
import { BrowserCheckContent } from '../layouts/BrowserCheckContent';
import { DnsCheckContent } from '../layouts/DnsCheckContent';
import { GrpcCheckContent } from '../layouts/GrpcCheckContent';
import { HTTP_CHECK_FIELDS, HttpCheckContent } from '../layouts/HttpCheckContent';
import { MULTI_HTTP_CHECK_REG_EXP_LIST, MultiHttpCheckContent } from '../layouts/MultiHttpCheckContent';
import { PingCheckContent } from '../layouts/PingCheckContent';
import { SCRIPTED_CHECK_FIELDS, ScriptedCheckContent } from '../layouts/ScriptedCheckContent';
import { TcpCheckContent } from '../layouts/TcpCheckContent';
import { TracerouteCheckContent } from '../layouts/TracerouteCheckContent';

// TODO: Finish this!
function getCheckTypeFields(checkType: CheckType) {
  switch (checkType) {
    case CheckType.HTTP:
      return HTTP_CHECK_FIELDS;
    case CheckType.MULTI_HTTP:
      return MULTI_HTTP_CHECK_REG_EXP_LIST;
    case CheckType.Scripted:
      return SCRIPTED_CHECK_FIELDS;
    default:
      return undefined;
  }
}

const checkTypeLayoutMap: Record<CheckType, ComponentType> = {
  /* Protocol checks (blackbox exporter)*/
  [CheckType.HTTP]: HttpCheckContent,
  [CheckType.PING]: PingCheckContent,
  [CheckType.GRPC]: GrpcCheckContent,
  [CheckType.DNS]: DnsCheckContent,
  [CheckType.TCP]: TcpCheckContent,
  [CheckType.Traceroute]: TracerouteCheckContent,
  /* Scripted checks (k6) */
  [CheckType.MULTI_HTTP]: MultiHttpCheckContent,
  [CheckType.Scripted]: ScriptedCheckContent,
  [CheckType.Browser]: BrowserCheckContent,
};

export function CheckSection() {
  const {
    checkMeta: { type },
  } = useChecksterContext();

  const SectionComponent = checkTypeLayoutMap[type] ?? null;
  const fields = getCheckTypeFields(type);

  return (
    <FormSection sectionName={FormSectionName.Check} fields={fields}>
      <SectionComponent />
    </FormSection>
  );
}
