import type { ConfirmError } from './ConfirmModal.types';

import { GENERIC_ERROR_MESSAGE } from './ConfirmModal.constants';

export function isErrorLike(error: any): error is ConfirmError {
  return (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    typeof error.name === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

export function getFallbackError(title: string): ConfirmError {
  return { name: `${title} error`, message: GENERIC_ERROR_MESSAGE };
}

export function getErrorWithFallback(error: any, title: string): ConfirmError {
  return isErrorLike(error) ? error : getFallbackError(title);
}

export function hasOnError(props: {
  onError?: (error: ConfirmError) => void;
}): props is { onError: (error: ConfirmError) => void } {
  return 'onError' in props && typeof props.onError === 'function';
}
