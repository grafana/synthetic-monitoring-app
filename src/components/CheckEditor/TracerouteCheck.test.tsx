import React from 'react';
import { screen, within } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AlertSensitivity, CheckType, Label, ROUTES } from 'types';
import { CheckForm } from 'components/CheckForm/CheckForm';
import { PLUGIN_URL_PATH } from 'components/constants';

import { fillBasicCheckFields, submitForm, toggleSection } from './testHelpers';

const JOB_NAME = `Traceroute job`;
const TARGET = `grafana.com`;
const LABELS: Label[] = [];

describe(`Displays sections of a Traceroute check correctly`, () => {
  it(`Renders a readonly field for the probe's timeout field with a value of 30 seconds`, async () => {
    const { user } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.Traceroute}`,
    });

    await fillBasicCheckFields(JOB_NAME, TARGET, user, LABELS);
    await toggleSection(`Probes`, user);

    const timeout = await screen.findByLabelText(/Timeout/);
    expect(timeout).toHaveValue(`30`);
  });

  it(`Renders 2 minutes 0 seconds by default for the frequency field`, async () => {
    const { user } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.Traceroute}`,
    });

    await fillBasicCheckFields(JOB_NAME, TARGET, user, LABELS);
    await toggleSection(`Probes`, user);

    const frequency = await screen.getByTestId(`frequency`);
    const minutes = await within(frequency).findByLabelText(/minutes/);
    const seconds = await within(frequency).findByLabelText(/seconds/);
    expect(minutes).toHaveValue(`2`);
    expect(seconds).toHaveValue(`0`);
  });
});

describe(`Submits a Traceroute check correctly`, () => {
  it(`Submits the form with a value of 30000 for the timeout field`, async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));

    const { user } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.Traceroute}`,
    });

    await fillBasicCheckFields(JOB_NAME, TARGET, user, LABELS);
    await submitForm(user);
    const { body } = await read();

    expect(body).toEqual({
      alertSensitivity: AlertSensitivity.None,
      basicMetricsOnly: true,
      enabled: true,
      frequency: 120000,
      job: JOB_NAME,
      labels: LABELS,
      probes: [PRIVATE_PROBE.id],
      settings: {
        traceroute: {
          hopTimeout: 0,
          maxHops: 64,
          maxUnknownHops: 15,
          ptrLookup: true,
        },
      },
      target: TARGET,
      timeout: 30000,
    });
  });
});
