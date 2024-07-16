import { HttpMethod, Label, MultiHttpAssertionType } from 'types';

export type MultiHttpVariable = {
  type: number;
  name: string;
  expression: string;
  attribute?: string;
};

export type RequestMethods = HttpMethod;
export type RequestProps = {
  method: RequestMethods;
  url: string;
  body?: MultiHttpRequestBody;
  headers?: Label[];
  queryFields?: Label[];
  postData?: {
    mimeType: string;
    text: string;
  };
};

export type KeyTypes = 'url' | 'body' | 'method' | 'headers' | 'queryFields' | 'postData';

export interface AssertionText {
  condition: AssertionConditionVariant;
  subject: AssertionSubjectVariant;
  type: MultiHttpAssertionType.Text;
  value: string;
}

export interface AssertionJsonPathValue {
  condition: AssertionConditionVariant;
  expression: string;
  type: MultiHttpAssertionType.JSONPathValue;
  value: string;
}

export interface AssertionJsonPath {
  expression: string;
  type: MultiHttpAssertionType.JSONPath;
}

export interface AssertionRegex {
  expression: string;
  type: MultiHttpAssertionType.Regex;
  subject: AssertionSubjectVariant;
}

export type Assertion = AssertionText | AssertionJsonPathValue | AssertionJsonPath | AssertionRegex;

export interface MultiHttpRequestBody {
  contentType: string;
  contentEncoding?: string;
  payload: string;
}

export interface MultiHttpEntry {
  variables?: MultiHttpVariable[];
  request: RequestProps;
  checks?: Assertion[];
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
