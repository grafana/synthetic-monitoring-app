import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';

import { IpVersion, TCPCheck } from 'types';
import { renderEditForm, submitForm } from 'page/__testHelpers__/checkForm';

const MIN_TCP_CHECK: TCPCheck = {
  id: 1,
  tenantId: 1,
  frequency: 60000,
  timeout: 3000,
  enabled: true,
  labels: [],
  settings: {
    tcp: {
      ipVersion: IpVersion.V4,
      tlsConfig: {},
    },
  },
  probes: [PRIVATE_PROBE.id] as number[],
  target: 'grafana.com:43',
  job: 'Job name for tcp',
  basicMetricsOnly: true,
  alertSensitivity: 'none',
};

// TODO: Fix this test
it(`TCPCheck -- can successfully submit an existing check with no editing`, async () => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => {
        return {
          json: [MIN_TCP_CHECK],
        };
      },
    })
  );

  const { read, user } = await renderEditForm(MIN_TCP_CHECK.id);

  await submitForm(user);

  const { body } = await read();
  expect(body).toBeTruthy();
});
