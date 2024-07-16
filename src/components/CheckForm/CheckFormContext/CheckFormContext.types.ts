import { CheckFormValues } from 'types';

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
