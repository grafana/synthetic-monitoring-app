import { MIN_FREQUENCY_BROWSER } from 'schemas/forms/BrowserCheckSchema';
import { MIN_FREQUENCY_MULTI_HTTP } from 'schemas/forms/MultiHttpCheckSchema';
import { MIN_FREQUENCY_SCRIPTED } from 'schemas/forms/ScriptedCheckSchema';
import { MIN_FREQUENCY_TRACEROUTE } from 'schemas/forms/TracerouteCheckSchema';
import { MIN_BASE_FREQUENCY } from 'schemas/general/Frequency';

import { CheckType } from 'types';
import { ONE_HOUR_IN_MS, ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

export const FREQUENCY_INPUT_ID = 'frequency-input';
export const FREQUENCY_SECONDS_INPUT_ID = 'frequency-seconds-input';
export const FREQUENCY_MINUTES_INPUT_ID = 'frequency-minutes-input';

export const FREQUENCY_OPTIONS = [
  ONE_SECOND_IN_MS * 10,
  ONE_SECOND_IN_MS * 30,
  ONE_MINUTE_IN_MS,
  ONE_MINUTE_IN_MS * 2,
  ONE_MINUTE_IN_MS * 3,
  ONE_MINUTE_IN_MS * 5,
  ONE_MINUTE_IN_MS * 10,
  ONE_MINUTE_IN_MS * 15,
  ONE_MINUTE_IN_MS * 30,
  ONE_HOUR_IN_MS,
];

export const MIN_FREQUENCY_MAP = {
  [CheckType.Browser]: MIN_FREQUENCY_BROWSER,
  [CheckType.DNS]: MIN_BASE_FREQUENCY,
  [CheckType.GRPC]: MIN_BASE_FREQUENCY,
  [CheckType.HTTP]: MIN_BASE_FREQUENCY,
  [CheckType.MULTI_HTTP]: MIN_FREQUENCY_MULTI_HTTP,
  [CheckType.PING]: MIN_BASE_FREQUENCY,
  [CheckType.Scripted]: MIN_FREQUENCY_SCRIPTED,
  [CheckType.TCP]: MIN_BASE_FREQUENCY,
  [CheckType.Traceroute]: MIN_FREQUENCY_TRACEROUTE,
};
