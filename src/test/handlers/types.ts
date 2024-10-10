import { DefaultBodyType, PathParams, RestRequest } from 'msw';

export type RequestRes = RestRequest<never, PathParams<string>> | RestRequest<DefaultBodyType, PathParams<string>>;

export type SuccessStatusCodes = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226;
// prettier-ignore
export type ClientError = 400 | 401 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451;
export type ServerError = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

export type ServerStatusCodes = SuccessStatusCodes | ClientError | ServerError;

export type Result<T> =
  | {
      status?: SuccessStatusCodes;
      json: T;
    }
  | {
      status?: ClientError | ServerError;
      json?: any;
    };

export type ApiEntry<T = any> = {
  route: string | RegExp;
  method: `get` | `post` | `put` | `patch` | `delete`;
  result: (req: RequestRes) => Result<T>;
};
