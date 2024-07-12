import { RequestContainer } from './RequestContainer';
import { RequestField } from './RequestField';
import { RequestInput } from './RequestInput';
import { RequestOptions } from './RequestOptions';
import { RequestOptionSection } from './RequestOptionSection';
import { RequestTest } from './RequestTest';

export const Request = Object.assign(RequestContainer, {
  Options: Object.assign(RequestOptions, {
    Section: RequestOptionSection,
  }),
  Field: RequestField,
  Test: RequestTest,
  Input: RequestInput,
});
