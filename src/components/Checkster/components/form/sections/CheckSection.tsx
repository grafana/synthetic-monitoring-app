import React, { ComponentType } from 'react';

import { FormSectionName } from '../../../types';
import { CheckType } from 'types';

import { useChecksterContext } from '../../../contexts/ChecksterContext';
import { FormSection } from '../FormSection';
import { BROWSER_CHECK_FIELDS, BrowserCheckContent } from '../layouts/BrowserCheckContent';
import { DNS_CHECK_FIELDS, DnsCheckContent } from '../layouts/DnsCheckContent';
import { GRPC_CHECK_FIELDS, GrpcCheckContent } from '../layouts/GrpcCheckContent';
import { HTTP_CHECK_FIELDS, HttpCheckContent } from '../layouts/HttpCheckContent';
import { MULTI_HTTP_CHECK_REG_EXP_LIST, MultiHttpCheckContent } from '../layouts/MultiHttpCheckContent';
import { PingCheckContent } from '../layouts/PingCheckContent';
import { SCRIPTED_CHECK_FIELDS, ScriptedCheckContent } from '../layouts/ScriptedCheckContent';
import { TCP_REQUEST_OPTIONS_FIELDS, TcpCheckContent } from '../layouts/TcpCheckContent';
import { TRACEROUTE_CHECK_FIELDS, TracerouteCheckContent } from '../layouts/TracerouteCheckContent';

const defaultCheckFields = ['job', 'target'];

function getCheckTypeFields(checkType: CheckType) {
  switch (checkType) {
    case CheckType.HTTP:
      return HTTP_CHECK_FIELDS;
    case CheckType.GRPC:
      return GRPC_CHECK_FIELDS;
    case CheckType.DNS:
      return DNS_CHECK_FIELDS;
    case CheckType.TCP:
      return TCP_REQUEST_OPTIONS_FIELDS;
    case CheckType.Traceroute:
      return TRACEROUTE_CHECK_FIELDS;
    case CheckType.MULTI_HTTP:
      return MULTI_HTTP_CHECK_REG_EXP_LIST;
    case CheckType.Scripted:
      return SCRIPTED_CHECK_FIELDS;
    case CheckType.Browser:
      return BROWSER_CHECK_FIELDS;
    default:
      return defaultCheckFields;
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

function getNavLabel(checkType: CheckType) {
  switch (checkType) {
    case CheckType.Browser:
    case CheckType.Scripted:
      return 'Script';
    case CheckType.MULTI_HTTP:
      return 'Requests';
    default:
      return 'Request';
  }
}

export function CheckSection() {
  const { checkType } = useChecksterContext();

  const SectionComponent = checkTypeLayoutMap[checkType] ?? null;
  const fields = getCheckTypeFields(checkType);

  return (
    <FormSection navLabel={getNavLabel(checkType)} sectionName={FormSectionName.Check} fields={fields}>
      <SectionComponent />
    </FormSection>
  );
}
