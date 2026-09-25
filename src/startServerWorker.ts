import { BatchInterceptor } from '@mswjs/interceptors';
import { FetchInterceptor } from '@mswjs/interceptors/fetch';
import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest';
import { HANDLERS_BY_ROUTE } from 'test/handlers';

// The "Get started" needs to create a datasource to let you into the plugin. This filters the create datasource
// route so it isn't mocked when running yarn dev:msw.
const handlers = Object.entries(HANDLERS_BY_ROUTE)
  .filter(([name]) => name !== 'createDatasource')
  .map(([, handler]) => handler);

const interceptor = new BatchInterceptor({
  name: 'msw-interceptor',
  interceptors: [new FetchInterceptor(), new XMLHttpRequestInterceptor()],
});

interceptor.apply();

// Grafana uses its document base URL for relative API paths. The fetch interceptor
// resolves strings against location.href instead, so resolve them before interception.
const fetchWithMocks = window.fetch;
window.fetch = (input, init) =>
  fetchWithMocks(typeof input === 'string' ? new URL(input, document.baseURI) : input, init);

interceptor.on('request', async ({ request, requestId, controller }) => {
  for (const handler of handlers) {
    const result = await handler.run({ request: request.clone(), requestId });

    if (result?.response) {
      controller.respondWith(result.response);
      return;
    }
  }
});
