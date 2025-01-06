import { screen } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';

import { HTTPCheck, HttpMethod, IpVersion } from 'types';
import { renderEditForm } from 'page/__testHelpers__/checkForm';

import { DataTestIds } from '../../../../../test/dataTestIds';

const MIN_HTTP_CHECK: HTTPCheck = {
  id: 1,
  tenantId: 1,
  frequency: 60000,
  timeout: 3000,
  enabled: true,
  labels: [],
  settings: {
    http: {
      ipVersion: IpVersion.V4,
      method: HttpMethod.GET,
      noFollowRedirects: false,
      failIfSSL: false,
      failIfNotSSL: false,
      tlsConfig: {},
    },
  },
  probes: [PRIVATE_PROBE.id] as number[],
  target: 'https://http.com',
  job: 'Job name for http',
  basicMetricsOnly: true,
  alertSensitivity: 'none',
};

it(`HTTPCheck -- can not submit an existing check without editing`, async () => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => {
        return {
          json: [MIN_HTTP_CHECK],
        };
      },
    })
  );

  await renderEditForm(MIN_HTTP_CHECK.id);
  expect(await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).not.toBeEnabled();
});
