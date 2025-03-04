import { CheckType } from 'types';

export type ChecksterType = CheckType;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ChecksterTypes {
  export type HTTPDisabledMethod = 'TRACE' | 'CONNECT'; // 'TRACE' and 'CONNECT' are not supported by old check creation flow

  export type HTTPMethod = Exclude<
    'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT',
    HTTPDisabledMethod
  >;
}
