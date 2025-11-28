import { ZodType } from 'zod';

import { CheckFormValues, CheckType, ProbeWithMetadata } from 'types';

import { createBrowserCheckSchema } from '../BrowserCheckSchema';
import { dnsCheckSchema } from '../DNSCheckSchema';
import { grpcCheckSchema } from '../GRPCCheckSchema';
import { httpCheckSchema } from '../HttpCheckSchema';
import { multiHttpCheckSchema } from '../MultiHttpCheckSchema';
import { pingCheckSchema } from '../PingCheckSchema';
import { createScriptedCheckSchema } from '../ScriptedCheckSchema';
import { tcpCheckSchema } from '../TCPCheckSchema';
import { tracerouteCheckSchema } from '../TracerouteCheckSchema';

const STATIC_SCHEMA_MAP = {
  [CheckType.DNS]: dnsCheckSchema,
  [CheckType.GRPC]: grpcCheckSchema,
  [CheckType.HTTP]: httpCheckSchema,
  [CheckType.MULTI_HTTP]: multiHttpCheckSchema,
  [CheckType.PING]: pingCheckSchema,
  [CheckType.TCP]: tcpCheckSchema,
  [CheckType.Traceroute]: tracerouteCheckSchema,
};

/**
 * Creates a schema for the given check type, optionally including probe compatibility validation
 * for k6 check types (Scripted and Browser).
 *
 * @param checkType - The type of check to create a schema for
 * @param availableProbes - Optional array of available probes for k6 compatibility validation
 * @returns A Zod schema for the check type
 */
export function createCheckSchema(
  checkType: CheckType,
  availableProbes?: ProbeWithMetadata[]
): ZodType<CheckFormValues> {
  if (checkType === CheckType.Scripted) {
    return createScriptedCheckSchema(availableProbes) as ZodType<CheckFormValues>;
  }

  if (checkType === CheckType.Browser) {
    return createBrowserCheckSchema(availableProbes) as ZodType<CheckFormValues>;
  }

  if (checkType in STATIC_SCHEMA_MAP) {
    return STATIC_SCHEMA_MAP[checkType as keyof typeof STATIC_SCHEMA_MAP];
  }

  throw new Error(`Unknown check type: ${checkType}`);
}
