import { ChecksterTypes } from './types';

export const REQUEST_METHODS: ChecksterTypes.HTTPMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
  // 'TRACE' and 'CONNECT' are not supported by old check creation flow
  // 'TRACE',
  // 'CONNECT',
];

export const REQUEST_METHODS_OPTIONS = REQUEST_METHODS.map((method) => ({ label: method, value: method }));

export const REQUEST_METHOD_DESCRIPTIONS: Record<ChecksterTypes.HTTPMethod, string> = {
  GET: 'Requests data from a specified resource',
  POST: 'Submits data to be processed to a specified resource',
  PUT: 'Uploads a representation of the specified resource',
  PATCH: 'Applies partial modifications to a resource',
  DELETE: 'Deletes the specified resource',
  HEAD: 'Asks for the response identical to the one that would correspond to a GET request, but without the response body',
  OPTIONS: 'Describes the communication options for the target resource',
  // TRACE: 'Performs
};
