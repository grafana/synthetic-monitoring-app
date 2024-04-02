import React from 'react';
import { screen } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AlertSensitivity, CheckType, IpVersion, Label, ROUTES } from 'types';
import { CheckForm } from 'components/CheckForm/CheckForm';
import { PLUGIN_URL_PATH } from 'components/constants';

import { fillBasicCheckFields, selectOption, submitForm } from './testHelpers';

const JOB_NAME = `TCP job`;
const TARGET = `tcpcheck.com:80`;
const LABELS: Label[] = [];

describe(`Edits the sections of a TCP check correctly`, () => {
  it(`edits the IP version of a TCP check`, async () => {
    const IP_VERSION = IpVersion.V6;

    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));

    const { user } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.TCP}`,
    });

    await fillBasicCheckFields(JOB_NAME, TARGET, user, LABELS);
    await user.click(await screen.getByText('Advanced options'));
    await selectOption(user, { label: 'IP version', option: IP_VERSION });
    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      alertSensitivity: AlertSensitivity.None,
      basicMetricsOnly: true,
      enabled: true,
      frequency: 60000,
      job: JOB_NAME,
      labels: LABELS,
      probes: [PRIVATE_PROBE.id],
      settings: {
        tcp: {
          ipVersion: IP_VERSION,
          queryResponse: [],
          tls: false,
          tlsConfig: { caCert: '', clientCert: '', clientKey: '', insecureSkipVerify: false, serverName: '' },
        },
      },
      target: TARGET,
      timeout: 3000,
    });
  });
});
