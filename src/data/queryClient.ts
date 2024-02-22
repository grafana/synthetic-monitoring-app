import { MutationCache, MutationOptions, QueryCache, QueryClient, QueryOptions } from '@tanstack/react-query';

import { FaroEvent, isFaroEventMeta, reportError, reportEvent } from 'faro';
import { showAlert } from 'data/utils';

export const getQueryClient = () =>
  new QueryClient({
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
        staleTime: Infinity,
        retry: false,
      },
    },
  });

export const queryClient = getQueryClient();

function handleSuccess(data: unknown, options: MutationOptions | QueryOptions) {
  const { meta } = options;

  if (meta && isFaroEventMeta(meta.event)) {
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
