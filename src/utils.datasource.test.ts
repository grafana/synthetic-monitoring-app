import axios from 'axios';

import { createNewApiInstance } from 'utils';

describe('createNewApiInstance', () => {
  it('posts to Grafana using an absolute API path', async () => {
    const request = jest.spyOn(axios, 'request').mockResolvedValue({ data: {} });

    await createNewApiInstance({
      accessToken: 'test-access-token',
      apiHost: 'https://synthetic-monitoring-api.grafana.net',
      metrics: { grafanaName: 'metrics', hostedId: 1, type: 'prometheus', uid: 'metrics' },
      logs: { grafanaName: 'logs', hostedId: 2, type: 'loki', uid: 'logs' },
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringMatching(/^https?:\/\/.*\/api\/datasources$/) })
    );
  });
});
