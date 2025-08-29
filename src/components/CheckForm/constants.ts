import { CheckType } from 'types';

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

export enum FormStepOrder {
  Check,
  Uptime,
  Labels,
  Execution,
  Alerting,
}
