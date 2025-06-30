import { MAX_TIMEOUT_AIAGENT, MIN_TIMEOUT_AIAGENT } from 'schemas/forms/AiAgentCheckSchema';
import { MAX_TIMEOUT_BROWSER, MIN_TIMEOUT_BROWSER } from 'schemas/forms/BrowserCheckSchema';
import { MAX_TIMEOUT_MULTI_HTTP, MIN_TIMEOUT_MULTI_HTTP } from 'schemas/forms/MultiHttpCheckSchema';
import { MAX_TIMEOUT_SCRIPTED, MIN_TIMEOUT_SCRIPTED } from 'schemas/forms/ScriptedCheckSchema';
import { MAX_TIMEOUT_TRACEROUTE, MIN_TIMEOUT_TRACEROUTE } from 'schemas/forms/TracerouteCheckSchema';
import { MAX_BASE_TIMEOUT, MIN_BASE_TIMEOUT } from 'schemas/general/Timeout';

import { CheckType } from 'types';

export const MIN_TIMEOUT_MAP = {
  [CheckType.AiAgent]: MIN_TIMEOUT_AIAGENT,
  [CheckType.Browser]: MIN_TIMEOUT_BROWSER,
  [CheckType.DNS]: MIN_BASE_TIMEOUT,
  [CheckType.GRPC]: MIN_BASE_TIMEOUT,
  [CheckType.HTTP]: MIN_BASE_TIMEOUT,
  [CheckType.MULTI_HTTP]: MIN_TIMEOUT_MULTI_HTTP,
  [CheckType.PING]: MIN_BASE_TIMEOUT,
  [CheckType.Scripted]: MIN_TIMEOUT_SCRIPTED,
  [CheckType.TCP]: MIN_BASE_TIMEOUT,
  [CheckType.Traceroute]: MIN_TIMEOUT_TRACEROUTE,
};

export const MAX_TIMEOUT_MAP = {
  [CheckType.AiAgent]: MAX_TIMEOUT_AIAGENT,
  [CheckType.Browser]: MAX_TIMEOUT_BROWSER,
  [CheckType.DNS]: MAX_BASE_TIMEOUT,
  [CheckType.GRPC]: MAX_BASE_TIMEOUT,
  [CheckType.HTTP]: MAX_BASE_TIMEOUT,
  [CheckType.MULTI_HTTP]: MAX_TIMEOUT_MULTI_HTTP,
  [CheckType.PING]: MAX_BASE_TIMEOUT,
  [CheckType.Scripted]: MAX_TIMEOUT_SCRIPTED,
  [CheckType.TCP]: MAX_BASE_TIMEOUT,
  [CheckType.Traceroute]: MAX_TIMEOUT_TRACEROUTE,
};
