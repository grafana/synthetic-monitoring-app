import { CheckType, FeatureName } from 'types';

import { isFeatureEnabled } from '../../contexts/FeatureFlagContext';
import { browserCheckSchema } from '../../schemas/forms/BrowserCheckSchema';
import { dnsCheckSchema } from '../../schemas/forms/DNSCheckSchema';
import { grpcCheckSchema } from '../../schemas/forms/GRPCCheckSchema';
import { httpCheckSchema } from '../../schemas/forms/HttpCheckSchema';
import { multiHttpCheckSchema } from '../../schemas/forms/MultiHttpCheckSchema';
import { pingCheckSchema } from '../../schemas/forms/PingCheckSchema';
import { scriptedCheckSchema } from '../../schemas/forms/ScriptedCheckSchema';
import { tcpCheckSchema } from '../../schemas/forms/TCPCheckSchema';
import { tracerouteCheckSchema } from '../../schemas/forms/TracerouteCheckSchema';

export const SCHEMA_MAP = {
  [CheckType.Browser]: browserCheckSchema,
  [CheckType.DNS]: dnsCheckSchema,
  [CheckType.GRPC]: grpcCheckSchema,
  [CheckType.HTTP]: httpCheckSchema,
  [CheckType.MULTI_HTTP]: multiHttpCheckSchema,
  [CheckType.PING]: pingCheckSchema,
  [CheckType.Scripted]: scriptedCheckSchema,
  [CheckType.TCP]: tcpCheckSchema,
  [CheckType.Traceroute]: tracerouteCheckSchema,
};

export type FormSectionName = (typeof FORM_SECTION_ORDER)[number];

export const FORM_SECTION_ORDER = isFeatureEnabled(FeatureName.AlertsPerCheck)
  ? (['job', 'uptime', 'labels', 'execution', 'alerting'] as const)
  : (['job', 'uptime', 'labels', 'alerting', 'execution'] as const);

type FormSectionMap = Record<(typeof FORM_SECTION_ORDER)[number], number>;

export const FORM_SECTION_MAP = FORM_SECTION_ORDER.reduce<FormSectionMap>((acc, item, index) => {
  acc[item] = index;

  return acc;
}, {} as FormSectionMap);

export enum FormSectionIndex {
  Check = FORM_SECTION_MAP.job,
  Uptime = FORM_SECTION_MAP.uptime,
  Labels = FORM_SECTION_MAP.labels,
  Execution = FORM_SECTION_MAP.execution,
  Alerting = FORM_SECTION_MAP.alerting,
}
