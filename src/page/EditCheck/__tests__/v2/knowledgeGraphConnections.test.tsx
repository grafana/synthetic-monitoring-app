import { useAppPluginInstalled } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { CHECKSTER_TEST_ID, ROUTER_TEST_ID } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsViewer, testUsesCombobox } from 'test/utils';

import { Check, FeatureName, HttpMethod, IpVersion, Label } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { renderEditForm } from 'page/__testHelpers__/checkForm';

const SERVICE_AND_CUSTOM_LABELS: Label[] = [
  { name: 'service_name', value: 'frontend' },
  { name: 'namespace', value: 'banking-prod' },
  { name: 'app', value: 'banking' },
];

async function editConnections(labels: Label[] = SERVICE_AND_CUSTOM_LABELS) {
  server.use(
    apiRoute('listChecks', {
      result: () => ({
        json: [
          {
            ...BASIC_HTTP_CHECK,
            frequency: 60_000,
            timeout: 3_000,
            alerts: [],
            settings: { http: { method: HttpMethod.Get, ipVersion: IpVersion.V4 } },
            labels,
          },
        ],
      }),
    })
  );

  const result = await renderEditForm(BASIC_HTTP_CHECK.id);
  await gotoSection(result.user, FormSectionName.Labels);
  await screen.findByText('Knowledge Graph connections');

  return result;
}

async function addFrontendConnection(user: Awaited<ReturnType<typeof editConnections>>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Add connection' }));
  await user.click(await screen.findByRole('menuitem', { name: /^Frontend application/ }));
}

async function readSavedCheck(read: () => Promise<{ body?: Check }>) {
  await waitFor(() => {
    expect(screen.getByTestId(ROUTER_TEST_ID.pathname).textContent).toBe(
      generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_HTTP_CHECK.id! })
    );
  });

  return (await read()).body;
}

beforeEach(() => {
  testUsesCombobox();
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
  (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: true });
});

it('saves a frontend connection alongside the existing service and custom app label', async () => {
  const { user, read } = await editConnections();

  await addFrontendConnection(user);
  const input = screen.getByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  expect(input).toHaveValue('');
  expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeDisabled();
  expect(screen.getByDisplayValue('app')).toBeInTheDocument();

  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /banking · production/ }));
  expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeEnabled();
  await submitForm(user);

  expect((await readSavedCheck(read))?.labels).toEqual([
    ...SERVICE_AND_CUSTOM_LABELS,
    { name: 'feo11y_app_id', value: '229' },
  ]);
});

it('removes only the frontend association from the saved check', async () => {
  const { user, read } = await editConnections([...SERVICE_AND_CUSTOM_LABELS, { name: 'feo11y_app_id', value: '229' }]);

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  expect(screen.getByDisplayValue('app')).toBeInTheDocument();
  expect(screen.getAllByRole('textbox', { name: /Custom labels \d+ name/ })).toHaveLength(1);

  await user.click(screen.getByRole('button', { name: 'Remove frontend connection' }));
  await submitForm(user);

  expect((await readSavedCheck(read))?.labels).toEqual(SERVICE_AND_CUSTOM_LABELS);
});

it('saves a CAL-managed frontend selection once and keeps its cost attribution field in sync', async () => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true, [FeatureName.CALs]: true });
  server.use(
    apiRoute('getTenantCostAttributionLabels', {
      result: () => ({ json: { names: ['feo11y_app_id'] } }),
    })
  );
  const { user, read } = await editConnections();

  await addFrontendConnection(user);
  const input = screen.getByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /banking · production/ }));

  expect(screen.getByRole('textbox', { name: 'Cost attribution label 1 value' })).toHaveValue('229');
  await submitForm(user);

  const savedCheck = await readSavedCheck(read);
  expect(savedCheck?.labels).toEqual([{ name: 'feo11y_app_id', value: '229' }, ...SERVICE_AND_CUSTOM_LABELS]);
});

it('prevents viewers from changing or clearing frontend connections', async () => {
  runTestAsViewer();
  await editConnections([...SERVICE_AND_CUSTOM_LABELS, { name: 'feo11y_app_id', value: '229' }]);

  expect(await screen.findByDisplayValue('banking · production')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove frontend connection' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove service connection' })).toBeDisabled();
  expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeDisabled();
});

it('saves a frontend-only connection after removing the old service and preserving custom labels', async () => {
  const { user, read } = await editConnections([...SERVICE_AND_CUSTOM_LABELS, { name: 'feo11y_app_id', value: '229' }]);

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Remove service connection' }));

  expect(screen.queryByRole('combobox', { name: 'Service name' })).not.toBeInTheDocument();
  expect(screen.getByDisplayValue('banking · production')).toBeInTheDocument();
  await submitForm(user);

  expect((await readSavedCheck(read))?.labels).toEqual([
    { name: 'app', value: 'banking' },
    { name: 'feo11y_app_id', value: '229' },
  ]);
});

it('keeps CAL fields in sync when removing a service connection and preserves unrelated attribution', async () => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true, [FeatureName.CALs]: true });
  server.use(
    apiRoute('getTenantCostAttributionLabels', {
      result: () => ({ json: { names: ['service_name', 'namespace', 'team'] } }),
    })
  );
  const { user, read } = await editConnections([
    ...SERVICE_AND_CUSTOM_LABELS,
    { name: 'feo11y_app_id', value: '229' },
    { name: 'team', value: 'payments' },
  ]);

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Remove service connection' }));

  expect(screen.getByRole('combobox', { name: 'Cost attribution label 1 value' })).toHaveValue('');
  expect(screen.getByRole('combobox', { name: 'Cost attribution label 2 value' })).toHaveValue('');
  expect(screen.getByRole('textbox', { name: 'Cost attribution label 3 value' })).toHaveValue('payments');
  await submitForm(user);

  expect((await readSavedCheck(read))?.labels).toEqual([
    { name: 'team', value: 'payments' },
    { name: 'app', value: 'banking' },
    { name: 'feo11y_app_id', value: '229' },
  ]);
});

it('prevents viewers from adding a missing connection', async () => {
  runTestAsViewer();
  await editConnections([{ name: 'feo11y_app_id', value: '229' }]);

  expect(await screen.findByDisplayValue('banking · production')).toBeDisabled();
  expect(await screen.findByRole('button', { name: 'Add connection' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove frontend connection' })).toBeDisabled();
});
