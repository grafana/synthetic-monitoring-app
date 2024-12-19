import { screen } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';

import { IpVersion, TCPCheck } from 'types';
import { renderEditForm } from 'page/__testHelpers__/checkForm';

import { DataTestIds } from '../../../../../test/dataTestIds';

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

// This should not be enabled when issue #1026 is fixed
it.skip(`TCPCheck -- can not submit an existing check without editing`, async () => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => {
        return {
          json: [MIN_TCP_CHECK],
        };
      },
    })
  );

  await renderEditForm(MIN_TCP_CHECK.id);

  expect(await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).not.toBeEnabled();
});
