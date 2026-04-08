import { BatchInterceptor } from '@mswjs/interceptors';
import { FetchInterceptor } from '@mswjs/interceptors/fetch';
import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest';
import { HANDLERS } from 'test/handlers';

const interceptor = new BatchInterceptor({
  name: 'msw-interceptor',
  interceptors: [new FetchInterceptor(), new XMLHttpRequestInterceptor()],
});

interceptor.apply();

interceptor.on('request', async ({ request, requestId, controller }) => {
  for (const handler of HANDLERS) {
    const result = await handler.run({ request: request.clone(), requestId });

    if (result?.response) {
      controller.respondWith(result.response);
      return;
    }
  }
});
