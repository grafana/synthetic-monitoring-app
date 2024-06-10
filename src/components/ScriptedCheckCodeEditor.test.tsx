import React from 'react';
import { screen, within } from '@testing-library/react';
import { BASIC_SCRIPTED_CHECK } from 'test/fixtures/checks';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AlertSensitivity, CheckType, ROUTES } from 'types';
import { CheckForm } from 'components/CheckForm/CheckForm';

import { submitForm } from './CheckEditor/testHelpers';
import { FIVE_MINUTES_IN_MS, PLUGIN_URL_PATH } from './constants';

const { findByLabelText, findByPlaceholderText, findByTestId, findByText, getByText } = screen;

describe('new scripted check', () => {
  it('renders the new scripted check form', async () => {
    const { findByText } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.Scripted}`,
    });
    expect(await findByText('Add Scripted check')).toBeInTheDocument();
  });

  it('creates a new k6 check', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));
    const { user } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.Scripted}`,
    });

    const JOB_NAME = 'New k6 check';
    const TARGET = 'https://www.k6.com';
    const LABEL = { name: 'k6labelname', value: 'k6labelvalue' };
    const SCRIPT = 'console.log("hello world")';

    const jobNameInput = await findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, JOB_NAME);
    const targetInput = await findByLabelText('Instance', { exact: false });
    await user.type(targetInput, TARGET);

    // Set probe options
    const probeOptions = getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    const probeSelectMenu = await within(probeOptions).getByLabelText('Probe locations', { exact: false });
    await user.click(probeSelectMenu);
    await user.click(screen.getByText(PRIVATE_PROBE.name));

    const addLabel = await findByText('Add label');
    await user.click(addLabel);
    const labelNameInput = await findByPlaceholderText('name');
    await user.type(labelNameInput, LABEL.name);
    const labelValueInput = await findByPlaceholderText('value');
    await user.type(labelValueInput, LABEL.value);

    const codeEditor = await findByTestId('code-editor');
    codeEditor.focus();
    await user.clear(codeEditor);
    await user.type(codeEditor, SCRIPT);
    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      job: JOB_NAME,
      target: TARGET,
      probes: [PRIVATE_PROBE.id],
      labels: [LABEL],
      settings: {
        scripted: {
          script: btoa(SCRIPT),
        },
      },
      alertSensitivity: AlertSensitivity.None,
      basicMetricsOnly: true,
      enabled: true,
      frequency: FIVE_MINUTES_IN_MS,
      timeout: 15000, // 15 seconds
    });
  });
});

describe('edit scripted check', () => {
  it('populates correct values in form', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));

    const { user, findByLabelText, findByTestId, findByPlaceholderText, findByText } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:checkType/:id`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/scripted/${BASIC_SCRIPTED_CHECK.id}`,
    });
    const jobNameInput = await findByLabelText('Job name', { exact: false });
    expect(jobNameInput).toHaveValue(BASIC_SCRIPTED_CHECK.job);
    const targetInput = await findByLabelText('Instance', { exact: false });
    expect(targetInput).toHaveValue(BASIC_SCRIPTED_CHECK.target);

    expect(await findByText(PRIVATE_PROBE.name)).toBeInTheDocument();
    const labelNameInput = await findByPlaceholderText('name');
    expect(labelNameInput).toHaveValue(BASIC_SCRIPTED_CHECK.labels[0].name);
    const labelValueInput = await findByPlaceholderText('value');
    expect(labelValueInput).toHaveValue(BASIC_SCRIPTED_CHECK.labels[0].value);
    const codeEditor = await findByTestId('code-editor');
    expect(codeEditor).toHaveValue(atob(BASIC_SCRIPTED_CHECK.settings.scripted?.script!));
    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual(BASIC_SCRIPTED_CHECK);
  });

  it('handles editing correctly', async () => {
    const NEW_JOB_NAME = 'different job name';
    const NEW_TARGET_URL = 'https://www.example.com';
    const NEW_LABEL = { name: 'adifferentlabelname', value: 'adifferentlabelValue' };
    const NEW_SCRIPT = 'console.log("goodnight moon")';

    const { record, read } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const { user, findByLabelText, findByTestId, findByPlaceholderText, getByText } = render(<CheckForm />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:checkType/:id`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/scripted/${BASIC_SCRIPTED_CHECK.id}`,
    });
    const jobNameInput = await findByLabelText('Job name', { exact: false });
    await user.clear(jobNameInput);
    await user.type(jobNameInput, NEW_JOB_NAME);
    const targetInput = await findByLabelText('Instance', { exact: false });
    await user.clear(targetInput);
    await user.type(targetInput, NEW_TARGET_URL);
    // probes
    // Set probe options
    const probeOptions = getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    await user.click(screen.getByText(`Clear`));
    const probeSelectMenu = await within(probeOptions).getByLabelText('Probe locations', { exact: false });
    await user.click(probeSelectMenu);
    await user.click(screen.getByText(PUBLIC_PROBE.name, { exact: false }));

    const labelNameInput = await findByPlaceholderText('name');
    await user.clear(labelNameInput);
    await user.type(labelNameInput, NEW_LABEL.name);
    const labelValueInput = await findByPlaceholderText('value');
    await user.clear(labelValueInput);
    await user.type(labelValueInput, NEW_LABEL.value);
    const codeEditor = await findByTestId('code-editor');
    await user.clear(codeEditor);
    await user.type(codeEditor, NEW_SCRIPT);
    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      ...BASIC_SCRIPTED_CHECK,
      job: NEW_JOB_NAME,
      target: NEW_TARGET_URL,
      probes: [PUBLIC_PROBE.id],
      labels: [NEW_LABEL],
      tenantId: undefined,
      settings: {
        scripted: {
          script: btoa(NEW_SCRIPT),
        },
      },
    });
  });
});
