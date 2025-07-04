import { CheckType } from 'types';

import { BrowserCheckLayout } from './CheckBrowserLayout';
import { DNSCheckLayout } from './CheckDNSLayout';
import { GRPCCheckLayout } from './CheckGrpcLayout';
import { HttpCheckLayout } from './CheckHttpLayout';
import { MultiHTTPCheckLayout } from './CheckMultiHttpLayout';
import { PingCheckLayout } from './CheckPingLayout';
import { ScriptedCheckLayout } from './CheckScriptedLayout';
import { TCPCheckLayout } from './CheckTCPLayout';
import { TracerouteCheckLayout } from './CheckTracerouteLayout';

export const layoutMap = {
  [CheckType.HTTP]: HttpCheckLayout,
  [CheckType.MULTI_HTTP]: MultiHTTPCheckLayout,
  [CheckType.Scripted]: ScriptedCheckLayout,
  [CheckType.PING]: PingCheckLayout,
  [CheckType.DNS]: DNSCheckLayout,
  [CheckType.TCP]: TCPCheckLayout,
  [CheckType.Traceroute]: TracerouteCheckLayout,
  [CheckType.GRPC]: GRPCCheckLayout,
  [CheckType.Browser]: BrowserCheckLayout,
};
