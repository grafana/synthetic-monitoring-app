import { useAppPluginInstalled } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { addConnection } from 'features/knowledgeGraph/__testHelpers__/connections';
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

it('selects and changes a frontend alongside the existing service and custom app label', async () => {
  const { user, read } = await editConnections();
  await addConnection(user, 'Frontend application');
  const input = screen.getByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  expect(input).toHaveValue('');
  expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeDisabled();
  expect(screen.getByDisplayValue('app')).toBeInTheDocument();

  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /banking · production/ }));
  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /ecommerce · production/ }));
  await submitForm(user);

  expect((await readSavedCheck(read))?.labels).toEqual([
    ...SERVICE_AND_CUSTOM_LABELS,
    { name: 'feo11y_app_id', value: '230' },
  ]);
});

it('restores a saved frontend and removes only its association', async () => {
  const { user, read } = await editConnections([...SERVICE_AND_CUSTOM_LABELS, { name: 'feo11y_app_id', value: '229' }]);

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  expect(screen.getAllByRole('textbox', { name: /Custom labels \d+ name/ })).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Remove frontend application connection' }));
  expect(screen.queryByRole('combobox', { name: 'Frontend application' })).not.toBeInTheDocument();
  await submitForm(user);

  expect((await readSavedCheck(read))?.labels).toEqual(SERVICE_AND_CUSTOM_LABELS);
});

it.each([false, true])('synchronizes and saves the CAL-managed frontend (clear: %s)', async (clear) => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true, [FeatureName.CALs]: true });
  server.use(
    apiRoute('getTenantCostAttributionLabels', {
      result: () => ({ json: { names: ['feo11y_app_id'] } }),
    })
  );
  const { user, read } = await editConnections(
    clear ? [...SERVICE_AND_CUSTOM_LABELS, { name: 'feo11y_app_id', value: '229' }] : SERVICE_AND_CUSTOM_LABELS
  );
  if (!clear) {
    await addConnection(user, 'Frontend application');
  }
  const input = screen.getByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /banking · production/ }));

  const calInput = screen.getByRole('textbox', { name: 'Cost attribution label 1 value' });
  expect(calInput).toHaveValue('229');
  await user.clear(calInput);
  await user.type(calInput, '230');
  expect(await screen.findByRole('combobox', { name: 'Frontend application' })).toHaveValue('ecommerce · production');
  if (clear) {
    await user.click(screen.getByRole('button', { name: 'Remove frontend application connection' }));
    expect(calInput).toHaveValue('');
  }
  await submitForm(user);

  expect((await readSavedCheck(read))?.labels).toEqual(
    clear ? SERVICE_AND_CUSTOM_LABELS : [{ name: 'feo11y_app_id', value: '230' }, ...SERVICE_AND_CUSTOM_LABELS]
  );
});

it('prevents viewers from editing or removing saved connections', async () => {
  runTestAsViewer();
  await editConnections([...SERVICE_AND_CUSTOM_LABELS, { name: 'feo11y_app_id', value: '229' }]);

  expect(await screen.findByDisplayValue('banking · production')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove frontend application connection' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove service connection' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Service name' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Namespace' })).toBeDisabled();
  expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeDisabled();
});

it('prevents viewers from adding a missing connection', async () => {
  runTestAsViewer();
  await editConnections();
  expect(screen.getByRole('button', { name: 'Add connection' })).toBeDisabled();
  expect(screen.queryByRole('combobox', { name: 'Frontend application' })).not.toBeInTheDocument();
});

it.each([false, true])('saves an unscoped service without removing it (CAL-managed namespace: %s)', async (cal) => {
  if (cal) {
    mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true, [FeatureName.CALs]: true });
    server.use(
      apiRoute('getTenantCostAttributionLabels', {
        result: () => ({ json: { names: ['namespace'] } }),
      })
    );
  }
  const { user, read } = await editConnections();
  await user.click(screen.getByRole('combobox', { name: 'Namespace' }));
  await user.click(await screen.findByRole('option', { name: 'Any namespace' }));
  expect(screen.getByRole('combobox', { name: 'Service name' })).toHaveValue('frontend');
  if (cal) {
    expect(screen.getByRole('combobox', { name: 'Cost attribution label 1 value' })).toHaveValue('');
  }
  await submitForm(user);
  expect((await readSavedCheck(read))?.labels).toEqual([
    { name: 'service_name', value: 'frontend' },
    { name: 'app', value: 'banking' },
  ]);
});

it.each([false, true])(
  'removes both service labels while preserving the frontend and unrelated labels (CAL: %s)',
  async (cal) => {
    if (cal) {
      mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true, [FeatureName.CALs]: true });
      server.use(
        apiRoute('getTenantCostAttributionLabels', {
          result: () => ({ json: { names: ['service_name', 'namespace', 'team'] } }),
        })
      );
    }
    const frontend = { name: 'feo11y_app_id', value: '229' };
    const team = { name: 'team', value: 'payments' };
    const { user, read } = await editConnections([...SERVICE_AND_CUSTOM_LABELS, frontend, team]);
    expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove service connection' }));
    expect(screen.queryByRole('group', { name: 'Service' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveValue('banking · production');
    if (cal) {
      expect(screen.getByRole('combobox', { name: 'Cost attribution label 1 value' })).toHaveValue('');
      expect(screen.getByRole('combobox', { name: 'Cost attribution label 2 value' })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: 'Cost attribution label 3 value' })).toHaveValue('payments');
    }
    await submitForm(user);
    expect((await readSavedCheck(read))?.labels).toEqual(
      cal ? [team, { name: 'app', value: 'banking' }, frontend] : [{ name: 'app', value: 'banking' }, frontend, team]
    );
  }
);
