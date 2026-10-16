import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { decode } from 'js-base64';
import { COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';
import { ONLINE_PROBE } from 'test/fixtures/probes';
import { MOCKED_SECRETS, MOCKED_SECURE_VALUE_ITEMS, MOCKED_SECURE_VALUES_API_RESPONSE } from 'test/fixtures/secrets';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import {
  mockFeatureToggles,
  runTestAsSecretsNoAccess,
  runTestAsSecretsReadOnly,
  runTestAsSMAdmin,
  selectOption,
} from 'test/utils';

import { FeatureName } from 'types';

import { AgenticJourneyDrawer } from './AgenticJourneyDrawer';

beforeEach(() => {
  mockFeatureToggles({ [FeatureName.Folders]: false, [FeatureName.SecretsManagement]: true });
  runTestAsSMAdmin();
  server.use(
    apiRoute('listProbes', { result: () => ({ json: [ONLINE_PROBE] }) }),
    apiRoute('addCheck', {
      result: async (req) => ({
        json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()), id: 123, created: 1700000000 },
      }),
    })
  );
});

async function renderDrawer() {
  const result = render(<AgenticJourneyDrawer onClose={jest.fn()} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create check' })).toBeEnabled());
  return result;
}

it('requires a URL, a description for every step and an Anthropic secret', async () => {
  const { user } = await renderDrawer();
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Enter a valid URL starting with https:// or http://.')).toBeInTheDocument();
  expect(screen.getByText('Describe this step.')).toBeInTheDocument();
  expect(screen.getByText('Select the secret that contains your Anthropic API key.')).toBeInTheDocument();
});

it('creates a browser check whose script runs the configured steps', async () => {
  const { record, read } = getServerRequests();
  server.use(
    apiRoute(
      'addCheck',
      { result: async (req) => ({ json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()), id: 123 } }) },
      record
    )
  );
  const { user } = await renderDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Name/ }), 'Checkout flow');
  await user.type(screen.getByRole('textbox', { name: /^Start URL/ }), 'https://grafana.com');
  await user.type(screen.getByLabelText('Step 1 instruction'), 'click the sign in button');
  await user.click(screen.getByRole('button', { name: 'Add step' }));
  await selectOption(user, { label: 'Step 2 type', option: /Assertion/ });
  await user.type(screen.getByLabelText('Step 2 instruction'), 'the dashboard is showing');
  await selectOption(user, { label: /LLM provider/, option: new RegExp(MOCKED_SECRETS[0].name) });
  await user.click(screen.getByRole('button', { name: 'Create check' }));

  const { body } = await read();
  expect(body.job).toBe('Checkout flow');
  const script = decode(body.settings.browser.script);
  expect(script).toContain('await page.ai.act("click the sign in button");');
  expect(script).toContain('await page.ai.assert("the dashboard is showing");');
  expect(script).toContain(`await secrets.get("${MOCKED_SECRETS[0].name}")`);
});

it('lets steps be reordered and removed', async () => {
  const { user } = await renderDrawer();
  expect(screen.getByRole('button', { name: 'Remove step' })).toBeDisabled();
  await user.type(screen.getByLabelText('Step 1 instruction'), 'first');
  await user.click(screen.getByRole('button', { name: 'Add step' }));
  await user.type(screen.getByLabelText('Step 2 instruction'), 'second');

  await user.click(screen.getAllByRole('button', { name: 'Move step up' })[1]);
  expect(screen.getByLabelText('Step 1 instruction')).toHaveValue('second');
  expect(screen.getByLabelText('Step 2 instruction')).toHaveValue('first');

  await user.click(screen.getAllByRole('button', { name: 'Remove step' })[1]);
  expect(screen.queryByLabelText('Step 2 instruction')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Step 1 instruction')).toHaveValue('second');
});

it('flags an invalid start URL as the user types and suggests a protocol', async () => {
  const { user } = await renderDrawer();
  const input = screen.getByRole('textbox', { name: /^Start URL/ });
  await user.type(input, 'grafana.com');
  expect(screen.getByText('Enter a valid URL starting with https:// or http://.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'https://grafana.com' }));
  expect(input).toHaveValue('https://grafana.com');
  expect(screen.queryByText('Enter a valid URL starting with https:// or http://.')).not.toBeInTheDocument();
});

describe('LLM provider', () => {
  it('asks an administrator to create the secret when the user cannot', async () => {
    runTestAsSecretsReadOnly();
    server.use(
      apiRoute('listSecrets', { result: () => ({ json: { ...MOCKED_SECURE_VALUES_API_RESPONSE, items: [] } }) })
    );
    render(<AgenticJourneyDrawer onClose={jest.fn()} />);
    expect(await screen.findByText(/Ask an administrator to create one/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create one' })).not.toBeInTheDocument();
  });

  it('disables the secret picker when the user cannot read secrets', async () => {
    runTestAsSecretsNoAccess();
    render(<AgenticJourneyDrawer onClose={jest.fn()} />);
    expect(await screen.findByRole('combobox', { name: /LLM provider/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Create a new one' })).not.toBeInTheDocument();
  });

  it('offers to create a secret when none exist', async () => {
    server.use(
      apiRoute('listSecrets', { result: () => ({ json: { ...MOCKED_SECURE_VALUES_API_RESPONSE, items: [] } }) })
    );
    await renderDrawer();
    expect(await screen.findByText(/You don’t have any secrets yet\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create one' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /LLM provider/ })).not.toBeInTheDocument();
  });

  it('offers to create another secret when some exist', async () => {
    await renderDrawer();
    expect(await screen.findByText(/No secret contains the Anthropic API key\?/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a new one' })).toBeInTheDocument();
  });

  it('creates a secret in a popup and preselects it', async () => {
    const { user } = await renderDrawer();
    await user.click(await screen.findByRole('button', { name: 'Create a new one' }));
    expect(await screen.findByRole('dialog', { name: 'Create secret' })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Value/), 'sk-ant-123');
    await user.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Create secret' })).not.toBeInTheDocument());
    expect(screen.getByRole('combobox', { name: /LLM provider/ })).toHaveValue(
      MOCKED_SECURE_VALUE_ITEMS[0].metadata.name
    );
  });

  it('explains that a secret is required when secrets management is off', async () => {
    mockFeatureToggles({ [FeatureName.SecretsManagement]: false });
    await renderDrawer();
    expect(screen.getByText('Secrets management is not available')).toBeInTheDocument();
  });
});

it('rejects names with commas or quotes', async () => {
  const { user } = await renderDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Name/ }), 'a, b');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText("Job names can't contain commas or quotes")).toBeInTheDocument();
});

describe('Test button', () => {
  it('validates before running anything', async () => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('testCheck', {}, record));
    const { user } = await renderDrawer();
    await user.click(screen.getByRole('button', { name: 'Test' }));
    expect(await screen.findByText('Enter a valid URL starting with https:// or http://.')).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('runs the check once, before it exists', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('testCheck', {}, record));
    const { user } = await renderDrawer();
    await user.type(screen.getByRole('textbox', { name: /^Start URL/ }), 'https://grafana.com');
    await user.type(screen.getByLabelText('Step 1 instruction'), 'click the sign in button');
    await selectOption(user, { label: /LLM provider/, option: new RegExp(MOCKED_SECRETS[0].name) });
    await user.click(screen.getByRole('button', { name: 'Test' }));

    const { body } = await read();
    expect(body.settings.browser.script).toBeDefined();
    expect(decode(body.settings.browser.script)).toContain('await page.ai.act("click the sign in button");');
    expect(body.probes).toEqual([ONLINE_PROBE.id]);
  });
});
