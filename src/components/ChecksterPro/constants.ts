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
