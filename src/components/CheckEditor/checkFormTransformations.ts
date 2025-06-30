import { Check, CheckFormValues, CheckType } from 'types';
import {
  isAiAgentCheck,
  isBrowserCheck,
  isDNSCheck,
  isGRPCCheck,
  isHttpCheck,
  isMultiHttpCheck,
  isPingCheck,
  isScriptedCheck,
  isTCPCheck,
  isTracerouteCheck,
} from 'utils.types';
import { getAiAgentCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.aiagent';
import { getBrowserCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.browser';
import { getDNSCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.dns';
import { getGRPCCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.grpc';
import { getHTTPCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.http';
import { getMultiHTTPCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.multihttp';
import { getPingCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.ping';
import { getScriptedCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.scripted';
import { getTCPCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.tcp';
import { getTracerouteCheckFormValues } from 'components/CheckEditor/transformations/toFormValues.traceroute';
import { getAiAgentPayload } from 'components/CheckEditor/transformations/toPayload.aiagent';
import { getBrowserPayload } from 'components/CheckEditor/transformations/toPayload.browser';
import { getDNSPayload } from 'components/CheckEditor/transformations/toPayload.dns';
import { getGRPCPayload } from 'components/CheckEditor/transformations/toPayload.grpc';
import { getHTTPPayload } from 'components/CheckEditor/transformations/toPayload.http';
import { getMultiHTTPPayload } from 'components/CheckEditor/transformations/toPayload.multihttp';
import { getPingPayload } from 'components/CheckEditor/transformations/toPayload.ping';
import { getScriptedPayload } from 'components/CheckEditor/transformations/toPayload.scripted';
import { getTCPPayload } from 'components/CheckEditor/transformations/toPayload.tcp';
import { getTraceroutePayload } from 'components/CheckEditor/transformations/toPayload.traceroute';

// export function getFormValuesFromCheck(check: DNSCheck): CheckFormValuesDns;
// export function getFormValuesFromCheck(check: GRPCCheck): CheckFormValuesGRPC;
// export function getFormValuesFromCheck(check: HTTPCheck): CheckFormValuesHttp;
// export function getFormValuesFromCheck(check: PingCheck): CheckFormValuesPing;
// export function getFormValuesFromCheck(check: TCPCheck): CheckFormValuesTcp;
// export function getFormValuesFromCheck(check: TracerouteCheck): CheckFormValuesTraceroute;
export function toFormValues(check: Check, checkType: CheckType): CheckFormValues {
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

  if (isBrowserCheck(check)) {
    return getBrowserCheckFormValues(check);
  }

  if (isAiAgentCheck(check)) {
    return getAiAgentCheckFormValues(check);
  }

  throw new Error(`Unknown check type`);
}

export const toPayload = (formValues: CheckFormValues): Check => {
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

  if (formValues.checkType === CheckType.Browser) {
    return getBrowserPayload(formValues);
  }

  if (formValues.checkType === CheckType.AiAgent) {
    return getAiAgentPayload(formValues);
  }

  throw new Error(`Unknown check type: ${formValues}`);
};
