import { Request as BRequest } from './Request';
import { RequestField } from './RequestField';
import { RequestInput } from './RequestInput';
import { RequestOptions } from './RequestOptions';
import { RequestOptionSection } from './RequestOptionSection';
import { RequestTest } from './RequestTest';

export const Request = Object.assign(BRequest, {
  Options: Object.assign(RequestOptions, {
    Section: RequestOptionSection,
  }),
  Field: RequestField,
  Test: RequestTest,
  Input: RequestInput,
});
