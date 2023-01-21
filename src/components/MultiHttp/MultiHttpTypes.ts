type VariableType = {
  type: number;
  name: string;
  expression: string;
};

type HeaderType = {
  name: 'Accept' | 'Accept-Charset' | 'Authorization' | 'Cache-Control' | 'Content-Type';
  value: string;
};

type QueryParams = {
  name: string;
  value: string;
};

export interface MultiHttpEntries {
  variables?: VariableType[];
  request: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
    url: string;
    headers?: HeaderType[];
    queryString?: QueryParams[];
    postData?: {
      mimeType: string;
      text: string;
    };
  };
}
