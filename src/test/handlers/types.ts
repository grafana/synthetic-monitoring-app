import { DefaultBodyType, PathParams, RestRequest } from 'msw';

export type RequestRes = RestRequest<never, PathParams<string>> | RestRequest<DefaultBodyType, PathParams<string>>;

export type ApiEntry<T = any> = {
  route: string | RegExp;
  method: `get` | `post` | `put` | `patch` | `delete`;
  result: (req: RequestRes) => {
    status?: number;
    json?: T;
  };
};
