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

export function getDefaultFormValues(checkType: CheckType = CheckType.Http) {
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
    case CheckType.Dns:
      return getDNSCheckFormValues(check as DNSCheck);
    case CheckType.Grpc:
      return getGRPCCheckFormValues(check as GRPCCheck);
    case CheckType.Http:
      return getHTTPCheckFormValues(check as HTTPCheck);
    case CheckType.MultiHttp:
      return getMultiHTTPCheckFormValues(check as MultiHTTPCheck);
    case CheckType.Ping:
      return getPingCheckFormValues(check as PingCheck);
    case CheckType.Scripted:
      return getScriptedCheckFormValues(check as ScriptedCheck);
    case CheckType.Tcp:
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
    case CheckType.Dns:
      return getDNSPayload(formValues);
    case CheckType.Http:
      return getHTTPPayload(formValues);
    case CheckType.Grpc:
      return getGRPCPayload(formValues);
    case CheckType.MultiHttp:
      return getMultiHTTPPayload(formValues);
    case CheckType.Ping:
      return getPingPayload(formValues);
    case CheckType.Scripted:
      return getScriptedPayload(formValues);
    case CheckType.Tcp:
      return getTCPPayload(formValues);
    case CheckType.Traceroute:
      return getTraceroutePayload(formValues);
    case CheckType.Browser:
      return getBrowserPayload(formValues);
    default:
      throw new Error(`Unable to convert form values to check. Unknown check type: '${(formValues as any).checkType}'`);
  }
}
