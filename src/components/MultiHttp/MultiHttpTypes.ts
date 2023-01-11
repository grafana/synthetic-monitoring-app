type VariableType = {
  type: number;
  name: string;
  expression: string;
};

type HeaderType = {
  name: string;
  value: string;
};

export interface MultiHttpEntries {
  variables?: VariableType[];
  request: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
    url: string;
    headers?: HeaderType[];
    postData?: {
      mimeType: string;
      text: string;
    };
  };
}
