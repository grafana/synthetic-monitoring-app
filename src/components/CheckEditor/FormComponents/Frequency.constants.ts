import { BROWSER_MIN_FREQUENCY } from 'schemas/forms/BrowserCheckSchema';

import { CheckType } from 'types';

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;

export const FREQUENCY_OPTIONS = [
  ONE_SECOND * 10,
  ONE_SECOND * 30,
  ONE_MINUTE,
  ONE_MINUTE * 2,
  ONE_MINUTE * 3,
  ONE_MINUTE * 5,
  ONE_MINUTE * 10,
  ONE_MINUTE * 15,
  ONE_MINUTE * 30,
  ONE_HOUR,
];

export const MIN_FREQUENCY_MAP = {
  [CheckType.Browser]: BROWSER_MIN_FREQUENCY,
  [CheckType.DNS]: 10,
  [CheckType.GRPC]: 10,
  [CheckType.HTTP]: 10,
  [CheckType.MULTI_HTTP]: 60,
  [CheckType.PING]: 10,
  [CheckType.Scripted]: 60,
  [CheckType.TCP]: 10,
  [CheckType.Traceroute]: 120,
};
