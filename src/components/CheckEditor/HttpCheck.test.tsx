import React from 'react';
import { screen } from '@testing-library/react';
import { merge } from 'lodash';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AlertSensitivity, CheckType, Label, ROUTES } from 'types';
import { CheckForm } from 'components/CheckForm/CheckForm';
import { PLUGIN_URL_PATH } from 'components/constants';

import { fillBasicCheckFields, selectOption, submitForm } from './testHelpers';

const JOB_NAME = `Http job`;
const TARGET = `https://grafana.com`;
const LABELS: Label[] = [];

const EXPECTED_PAYLOAD = {
  alertSensitivity: AlertSensitivity.None,
  basicMetricsOnly: true,
  enabled: true,
  frequency: 60000,
  job: JOB_NAME,
  labels: LABELS,
  probes: [PRIVATE_PROBE.id],
  settings: {
    http: {
      body: '',
      cacheBustingQueryParamName: '',
      compression: '',
      failIfBodyMatchesRegexp: [],
      failIfBodyNotMatchesRegexp: [],
      failIfHeaderMatchesRegexp: [],
      failIfHeaderNotMatchesRegexp: [],
      failIfNotSSL: false,
      failIfSSL: false,
      headers: [],
      ipVersion: 'V4',
      method: 'GET',
      noFollowRedirects: false,
      proxyConnectHeaders: [],
      proxyURL: '',
      tlsConfig: {
        caCert: '',
        clientCert: '',
        clientKey: '',
        insecureSkipVerify: false,
        serverName: '',
      },
      validHTTPVersions: [],
      validStatusCodes: [],
    },
  },
  target: TARGET,
  timeout: 3000,
};

describe(`Edits the sections of a HTTP check correctly`, () => {
  it(`Adds basic auth if added`, async () => {
    const basicAuth = {
      username: 'admin',
      password: 'hunter2',
    };

    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));

    const { user } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.HTTP}`,
    });

    await fillBasicCheckFields(JOB_NAME, TARGET, user, LABELS);
    await user.click(await screen.getByText('Authentication'));
    await user.click(await screen.findByLabelText('Basic'));
    await user.type(await screen.findByLabelText('Username *'), basicAuth.username);
    await user.type(await screen.findByLabelText('Password *'), basicAuth.password);
    await submitForm(user);

    const { body } = await read();

    expect(body).toStrictEqual(merge({}, EXPECTED_PAYLOAD, { settings: { http: { basicAuth } } }));
  });

  it(`Does not add basic auth if not added`, async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));

    const { user } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.HTTP}`,
    });

    await fillBasicCheckFields(JOB_NAME, TARGET, user, LABELS);
    await user.click(await screen.getByText('Authentication'));
    await submitForm(user);

    const { body } = await read();

    expect(body.settings.http.basicAuth).toBeUndefined();
    expect(body).toStrictEqual(EXPECTED_PAYLOAD);
  });

  it(`Adds probe fails if SSL is present to payload`, async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));

    const { user } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.HTTP}`,
    });

    await fillBasicCheckFields(JOB_NAME, TARGET, user, LABELS);
    await user.click(await screen.getByText('Validation', { selector: `span` }));
    await selectOption(user, { label: 'SSL options', option: 'Probe fails if SSL is present' });

    await submitForm(user);

    const { body } = await read();

    expect(body).toStrictEqual(
      merge({}, EXPECTED_PAYLOAD, {
        settings: {
          http: {
            failIfNotSSL: false,
            failIfSSL: true,
          },
        },
      })
    );
  });

  it(`Adds probe fails if SSL is present to payload`, async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));

    const { user } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.HTTP}`,
    });

    await fillBasicCheckFields(JOB_NAME, TARGET, user, LABELS);
    await user.click(await screen.getByText('Validation', { selector: `span` }));
    await selectOption(user, { label: 'SSL options', option: 'Probe fails if SSL is not present' });

    await submitForm(user);

    const { body } = await read();

    expect(body).toStrictEqual(
      merge({}, EXPECTED_PAYLOAD, {
        settings: {
          http: {
            failIfNotSSL: true,
            failIfSSL: false,
          },
        },
      })
    );
  });
});
