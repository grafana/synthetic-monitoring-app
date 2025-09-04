import { CheckType } from 'types';

import { createBrowserCheckSchema } from '../../schemas/forms/BrowserCheckSchema';
import { dnsCheckSchema } from '../../schemas/forms/DNSCheckSchema';
import { grpcCheckSchema } from '../../schemas/forms/GRPCCheckSchema';
import { httpCheckSchema } from '../../schemas/forms/HttpCheckSchema';
import { multiHttpCheckSchema } from '../../schemas/forms/MultiHttpCheckSchema';
import { pingCheckSchema } from '../../schemas/forms/PingCheckSchema';
import { createScriptedCheckSchema } from '../../schemas/forms/ScriptedCheckSchema';
import { tcpCheckSchema } from '../../schemas/forms/TCPCheckSchema';
import { tracerouteCheckSchema } from '../../schemas/forms/TracerouteCheckSchema';

export const SCHEMA_MAP = {
  [CheckType.Browser]: createBrowserCheckSchema,
  [CheckType.Scripted]: createScriptedCheckSchema,
  [CheckType.DNS]: dnsCheckSchema,
  [CheckType.GRPC]: grpcCheckSchema,
  [CheckType.HTTP]: httpCheckSchema,
  [CheckType.MULTI_HTTP]: multiHttpCheckSchema,
  [CheckType.PING]:  pingCheckSchema,
  [CheckType.TCP]: tcpCheckSchema,
  [CheckType.Traceroute]: tracerouteCheckSchema,
};
