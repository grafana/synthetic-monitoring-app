import { MutationCache, MutationOptions, QueryCache, QueryClient, QueryOptions } from '@tanstack/react-query';

import { FaroEvent, isFaroEventMeta, reportError, reportEvent } from 'faro';

import { showAlert } from './utils';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onSuccess: (data, query) => {
      handleSuccess(data, query.options);
    },
    onError: (error, query) => {
      handleError(error, query.options);
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: (data, payload, context, mutation) => {
      handleSuccess(data, mutation.options);
    },
    onError: (error, payload, context, mutation) => {
      handleError(error, mutation.options);
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function handleSuccess(data: unknown, options: MutationOptions | QueryOptions) {
  const { meta } = options;

  if (isFaroEventMeta(meta?.event)) {
    // @ts-expect-error -- doesn't error in later version of typescript
    const event = meta.event;
    reportEvent(event.type, event.info);
  }

  if (typeof options.meta?.successAlert === 'function') {
    showAlert('success', options.meta.successAlert(data));
  }
}

function handleError(error: Error, options: MutationOptions | QueryOptions) {
  if (options.meta?.event) {
    const event = options.meta.event as FaroEvent;
    reportError(error, event);
  }

  if (typeof options.meta?.errorAlert === 'function') {
    showAlert('error', options.meta.errorAlert(error));
  }
}
