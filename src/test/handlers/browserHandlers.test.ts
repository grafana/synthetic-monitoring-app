import { BROWSER_HANDLERS } from 'test/handlers';

async function hasMatchingBrowserHandler(path: string, method: string) {
  const request = new Request(`http://localhost${path}`, { method });

  for (const handler of BROWSER_HANDLERS) {
    const result = await handler.run({ request: request.clone(), requestId: 'browser-handler-test' });

    if (result) {
      return true;
    }
  }

  return false;
}

describe('browser mock handlers', () => {
  it('lets Grafana persist the Synthetic Monitoring datasource', async () => {
    await expect(hasMatchingBrowserHandler('/api/datasources', 'POST')).resolves.toBe(false);
  });

  it('still mocks Synthetic Monitoring API requests', async () => {
    await expect(hasMatchingBrowserHandler('/api/plugin-proxy/grafana-synthetic-monitoring-app/install', 'POST')).resolves.toBe(
      true
    );
    await expect(hasMatchingBrowserHandler('/sm/check/list', 'GET')).resolves.toBe(true);
  });
});
