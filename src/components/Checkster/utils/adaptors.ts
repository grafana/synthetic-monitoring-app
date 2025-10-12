import {
  BrowserCheck,
  Check,
  CheckFormValues,
  CheckType,
  DNSCheck,
  GRPCCheck,
  HTTPCheck,
  MultiHTTPCheck,
  PingCheck,
  ScriptedCheck,
  TCPCheck,
  TracerouteCheck,
} from 'types';
import { getCheckType } from 'utils';

import { DEFAULT_CHECK_CONFIG, DEFAULT_CHECK_CONFIG_MAP } from '../constants';
import { getBrowserCheckFormValues } from '../transformations/toFormValues.browser';
import { getDNSCheckFormValues } from '../transformations/toFormValues.dns';
import { getGRPCCheckFormValues } from '../transformations/toFormValues.grpc';
import { getHTTPCheckFormValues } from '../transformations/toFormValues.http';
import { getMultiHTTPCheckFormValues } from '../transformations/toFormValues.multihttp';
import { getPingCheckFormValues } from '../transformations/toFormValues.ping';
import { getScriptedCheckFormValues } from '../transformations/toFormValues.scripted';
import { getTCPCheckFormValues } from '../transformations/toFormValues.tcp';
import { getTracerouteCheckFormValues } from '../transformations/toFormValues.traceroute';
import { getBrowserPayload } from '../transformations/toPayload.browser';
import { getDNSPayload } from '../transformations/toPayload.dns';
import { getGRPCPayload } from '../transformations/toPayload.grpc';
import { getHTTPPayload } from '../transformations/toPayload.http';
import { getMultiHTTPPayload } from '../transformations/toPayload.multihttp';
import { getPingPayload } from '../transformations/toPayload.ping';
import { getScriptedPayload } from '../transformations/toPayload.scripted';
import { getTCPPayload } from '../transformations/toPayload.tcp';
import { getTraceroutePayload } from '../transformations/toPayload.traceroute';

export function getDefaultFormValues(checkType: CheckType = CheckType.HTTP) {
  const check: Check = DEFAULT_CHECK_CONFIG_MAP[checkType] ?? DEFAULT_CHECK_CONFIG;
  if (process.env.NODE_ENV === 'development') {
    if (!(checkType in DEFAULT_CHECK_CONFIG_MAP)) {
      console.warn(`getDefaultFormValues: Unable to get default form values for ${checkType}. Using fallback.`);
    }
  }

  return toFormValues(check);
}

export function toFormValues(check: Check): CheckFormValues {
  const checkType = getCheckType(check.settings);

  switch (checkType) {
    case CheckType.DNS:
      return getDNSCheckFormValues(check as DNSCheck);
    case CheckType.GRPC:
      return getGRPCCheckFormValues(check as GRPCCheck);
    case CheckType.HTTP:
      return getHTTPCheckFormValues(check as HTTPCheck);
    case CheckType.MULTI_HTTP:
      return getMultiHTTPCheckFormValues(check as MultiHTTPCheck);
    case CheckType.PING:
      return getPingCheckFormValues(check as PingCheck);
    case CheckType.Scripted:
      return getScriptedCheckFormValues(check as ScriptedCheck);
    case CheckType.TCP:
      return getTCPCheckFormValues(check as TCPCheck);
    case CheckType.Traceroute:
      return getTracerouteCheckFormValues(check as TracerouteCheck);
    case CheckType.Browser:
      return getBrowserCheckFormValues(check as BrowserCheck);
    default:
      throw new Error(`Unable to convert check to form values. Unknown check type: '${checkType}'`);
  }
}

export function toPayload(formValues: CheckFormValues): Check {
  switch (formValues.checkType) {
    case CheckType.DNS:
      return getDNSPayload(formValues);
    case CheckType.HTTP:
      return getHTTPPayload(formValues);
    case CheckType.GRPC:
      return getGRPCPayload(formValues);
    case CheckType.MULTI_HTTP:
      return getMultiHTTPPayload(formValues);
    case CheckType.PING:
      return getPingPayload(formValues);
    case CheckType.Scripted:
      return getScriptedPayload(formValues);
    case CheckType.TCP:
      return getTCPPayload(formValues);
    case CheckType.Traceroute:
      return getTraceroutePayload(formValues);
    case CheckType.Browser:
      return getBrowserPayload(formValues);
    default:
      throw new Error(`Unable to convert form values to check. Unknown check type: '${(formValues as any).checkType}'`);
  }
}
