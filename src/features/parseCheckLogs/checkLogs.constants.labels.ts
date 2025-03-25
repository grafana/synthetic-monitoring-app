// logs contract with the backend
import { MSG_STRINGS_COMMON, MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';

export const LOG_LABELS_COMMON = [`detected_level`, `level`, `service_name`];
export const LOG_LABELS_SM = [
  'check_name', // check type e.g. http, multihttp, scripted, etc
  'instance',
  'job',
  'msg',
  'probe',
  'probe_success',
  'region',
  'source',
  `target`,
];

type HTTPLogLabelsForMsg = {
  [key in keyof typeof MSG_STRINGS_HTTP]: string[];
};

type CommonLogLabelsForMsg = {
  [key in keyof typeof MSG_STRINGS_COMMON]: string[];
};

export const LOG_LABELS_FOR_MSG_COMMON: CommonLogLabelsForMsg = {
  BeginningCheck: [`timeout_seconds`, `type`],
  CheckFailed: [`duration_seconds`],
  CheckSucceeded: [`duration_seconds`],
};

export const LOG_LABELS_FOR_MSG_HTTP: HTTPLogLabelsForMsg = {
  AddressDoesNotMatchFirst: [`address`, `first`],
  ErrorBodyRegExp: [`body_regexp`],
  ErrorHTTPRequest: [`http_request`],
  FinalRequestWasOverSSL: [],
  InvalidHTTPResponseStatusCode: [`status_code`],
  InvalidHTTPVersionNumber: [`version`],
  MakingHTTPRequest: [`host`, `url`],
  ReceivedHTTPResponse: [`http_request`],
  ResolvedTarget: [`ip`],
  ResolvingTarget: [`ip_protocol`],
  ResponseTimings: [
    `connectDone`,
    `dnsDone`,
    `end`,
    `gotConn`,
    `responseStart`,
    `roundtrip`,
    `start`,
    `tlsDone`,
    `tlsStart`,
  ],
  ReceivedRedirect: [`location`],
};
