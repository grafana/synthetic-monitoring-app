import { CheckFormValues } from 'types';
import {
  DNSRequestFields,
  GRPCRequestFields,
  HttpRequestFields,
  PingRequestFields,
  TCPRequestFields,
  TracerouteRequestFields,
} from 'components/CheckEditor/CheckEditor.types';
export type Request = {
  id: number;
  check: {
    payload: CheckFormValues;
    state: 'pending' | 'success' | 'error';
  };
  data: {
    adHocId: null | string;
    state: 'pending' | 'success' | 'error';
    result: any;
  };
};

export type RequestFields =
  | HttpRequestFields
  | DNSRequestFields
  | GRPCRequestFields
  | TCPRequestFields
  | TracerouteRequestFields
  | PingRequestFields;
