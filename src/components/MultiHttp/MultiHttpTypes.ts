import { MultiHttpAssertionType } from 'types';

export type MultiHttpVariable = {
  type: number;
  name: string;
  expression: string;
  attribute?: string;
};

export type HeaderType = {
  name: 'Accept' | 'Accept-Charset' | 'Authorization' | 'Cache-Control' | 'Content-Type';
  value: string;
};

export type QueryParams = {
  name: string;
  value: string;
};

export type RequestMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
export type RequestProps = {
  method: RequestMethods;
  url: string;
  body?: MultiHttpRequestBody;
  headers?: HeaderType[];
  queryFields?: QueryParams[];
  postData?: {
    mimeType: string;
    text: string;
  };
};

export type KeyTypes = 'url' | 'body' | 'method' | 'headers' | 'queryFields' | 'postData';

export interface Assertion {
  type: MultiHttpAssertionType;
  subject?: AssertionSubjectVariant;
  expression?: string;
  condition?: AssertionConditionVariant;
  value?: string;
}

export interface MultiHttpRequestBody {
  contentType: string;
  contentEncoding?: string;
  payload: string;
}

export interface MultiHttpEntry {
  variables?: MultiHttpVariable[];
  request: RequestProps;
  checks: Assertion[];
}

export enum AssertionSubjectVariant {
  ResponseBody = 3,
  ResponseHeaders = 1,
  HttpStatusCode = 2,
}

export enum AssertionConditionVariant {
  Contains = 6,
  NotContains = 1,
  Equals = 2,
  StartsWith = 3,
  EndsWith = 4,
  TypeOf = 5,
}
