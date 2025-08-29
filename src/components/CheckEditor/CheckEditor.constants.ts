import { browserCheckSchema } from 'schemas/forms/BrowserCheckSchema';
import { dnsCheckSchema } from 'schemas/forms/DNSCheckSchema';
import { grpcCheckSchema } from 'schemas/forms/GRPCCheckSchema';
import { httpCheckSchema } from 'schemas/forms/HttpCheckSchema';
import { multiHttpCheckSchema } from 'schemas/forms/MultiHttpCheckSchema';
import { pingCheckSchema } from 'schemas/forms/PingCheckSchema';
import { scriptedCheckSchema } from 'schemas/forms/ScriptedCheckSchema';
import { tcpCheckSchema } from 'schemas/forms/TCPCheckSchema';
import { tracerouteCheckSchema } from 'schemas/forms/TracerouteCheckSchema';

import { CheckType, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';

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

export type FormSectionName = 'job' | 'uptime' | 'labels' | 'execution' | 'alerting';
export type FormSectionNameOrder = FormSectionName[];

export const DEFAULT_FORM_SECTION_ORDER: FormSectionNameOrder = [
  'job',
  'uptime',
  'labels',
  'execution',
  'alerting',
] as const;

export const LEGACY_FORM_SECTION_ORDER: FormSectionNameOrder = [
  'job',
  'uptime',
  'labels',
  'alerting',
  'execution',
] as const;

/** @deprecated Doesnt play nice with tests */
export const FORM_SECTION_ORDER = isFeatureEnabled(FeatureName.AlertsPerCheck)
  ? (['job', 'uptime', 'labels', 'execution', 'alerting'] as const)
  : (['job', 'uptime', 'labels', 'alerting', 'execution'] as const);

type FormSectionMap = Record<(typeof FORM_SECTION_ORDER)[number], number>;

export const FORM_SECTION_MAP = FORM_SECTION_ORDER.reduce<FormSectionMap>((acc, item, index) => {
  acc[item] = index;

  return acc;
}, {} as FormSectionMap);

export type FormSectionIndex = number;

// export enum FormSectionIndex {
//   Check = FORM_SECTION_MAP.job,
//   Uptime = FORM_SECTION_MAP.uptime,
//   Labels = FORM_SECTION_MAP.labels,
//   Execution = FORM_SECTION_MAP.execution,
//   Alerting = FORM_SECTION_MAP.alerting,
// }

/**
 * Because we have separated "multi-http" assertions, we need a
 * way to say that regardless of the entry's index, this error
 * belongs to the steps section or the uptime definition step.
 *
 * We have to wildcard the entry index in form errors.
 *
 * `-1` works well because it is type safe as it is a number, but
 * it is also impossible to be a valid index
 */
export const ENTRY_INDEX_CHAR = `-1`;
