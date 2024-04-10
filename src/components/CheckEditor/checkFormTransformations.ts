import { Check, CheckFormValues, CheckType } from 'types';
import {
  isDNSCheck,
  isGRPCCheck,
  isHttpCheck,
  isMultiHttpCheck,
  isPingCheck,
  isScriptedCheck,
  isTCPCheck,
  isTracerouteCheck,
} from 'utils.types';
import { getDNSCheckFormValues } from 'components/CheckEditor/transformations/form.dns';
import { getGRPCCheckFormValues } from 'components/CheckEditor/transformations/form.grpc';
import { getHTTPCheckFormValues } from 'components/CheckEditor/transformations/form.http';
import { getMultiHTTPCheckFormValues } from 'components/CheckEditor/transformations/form.multihttp';
import { getPingCheckFormValues } from 'components/CheckEditor/transformations/form.ping';
import { getScriptedCheckFormValues } from 'components/CheckEditor/transformations/form.scripted';
import { getTCPCheckFormValues } from 'components/CheckEditor/transformations/form.tcp';
import { getTracerouteCheckFormValues } from 'components/CheckEditor/transformations/form.traceroute';
import { getDNSPayload } from 'components/CheckEditor/transformations/payload.dns';
import { getGRPCPayload } from 'components/CheckEditor/transformations/payload.grpc';
import { getHTTPPayload } from 'components/CheckEditor/transformations/payload.http';
import { getMultiHTTPPayload } from 'components/CheckEditor/transformations/payload.multihttp';
import { getPingPayload } from 'components/CheckEditor/transformations/payload.ping';
import { getScriptedPayload } from 'components/CheckEditor/transformations/payload.scripted';
import { getTCPPayload } from 'components/CheckEditor/transformations/payload.tcp';
import { getTraceroutePayload } from 'components/CheckEditor/transformations/payload.traceroute';

// export function getFormValuesFromCheck(check: DNSCheck): CheckFormValuesDns;
// export function getFormValuesFromCheck(check: GRPCCheck): CheckFormValuesGRPC;
// export function getFormValuesFromCheck(check: HTTPCheck): CheckFormValuesHttp;
// export function getFormValuesFromCheck(check: PingCheck): CheckFormValuesPing;
// export function getFormValuesFromCheck(check: TCPCheck): CheckFormValuesTcp;
// export function getFormValuesFromCheck(check: TracerouteCheck): CheckFormValuesTraceroute;
export function getFormValuesFromCheck(check: Check, checkType: CheckType): CheckFormValues {
  if (isDNSCheck(check)) {
    return getDNSCheckFormValues(check);
  }

  if (isGRPCCheck(check)) {
    return getGRPCCheckFormValues(check);
  }

  if (isHttpCheck(check)) {
    return getHTTPCheckFormValues(check);
  }

  if (isMultiHttpCheck(check)) {
    return getMultiHTTPCheckFormValues(check);
  }

  if (isPingCheck(check)) {
    return getPingCheckFormValues(check);
  }

  if (isScriptedCheck(check)) {
    return getScriptedCheckFormValues(check);
  }

  if (isTCPCheck(check)) {
    return getTCPCheckFormValues(check);
  }

  if (isTracerouteCheck(check)) {
    return getTracerouteCheckFormValues(check);
  }

  throw new Error(`Unknown check type`);
}

export const getCheckFromFormValues = (formValues: CheckFormValues): Check => {
  if (formValues.checkType === CheckType.DNS) {
    return getDNSPayload(formValues);
  }

  if (formValues.checkType === CheckType.HTTP) {
    return getHTTPPayload(formValues);
  }

  if (formValues.checkType === CheckType.GRPC) {
    return getGRPCPayload(formValues);
  }

  if (formValues.checkType === CheckType.MULTI_HTTP) {
    return getMultiHTTPPayload(formValues);
  }

  if (formValues.checkType === CheckType.PING) {
    return getPingPayload(formValues);
  }

  if (formValues.checkType === CheckType.Scripted) {
    return getScriptedPayload(formValues);
  }

  if (formValues.checkType === CheckType.TCP) {
    return getTCPPayload(formValues);
  }

  if (formValues.checkType === CheckType.Traceroute) {
    return getTraceroutePayload(formValues);
  }

  throw new Error(`Unknown check type: ${formValues}`);
};
