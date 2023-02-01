export type VariableType = {
  type: number;
  name: string;
  expression: string;
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
  body?: string;
  headers?: HeaderType[];
  queryString?: QueryParams[];
  postData?: {
    mimeType: string;
    text: string;
  };
};

export type KeyTypes = 'url' | 'body' | 'method' | 'headers' | 'queryString' | 'postData';

export interface MultiHttpEntry {
  variables?: VariableType[];
  request: RequestProps;
}
