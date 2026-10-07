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

it('restores a saved frontend and clears only its association', async () => {
  const { user, read } = await editConnections([...SERVICE_AND_CUSTOM_LABELS, { name: 'feo11y_app_id', value: '229' }]);

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  expect(screen.getAllByRole('textbox', { name: /Custom labels \d+ name/ })).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Clear frontend connection' }));
  expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveValue('');
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
  const input = screen.getByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /banking · production/ }));

  const calInput = screen.getByRole('textbox', { name: 'Cost attribution label 1 value' });
  expect(calInput).toHaveValue('229');
  await user.clear(calInput);
  await user.type(calInput, '230');
  expect(input).toHaveValue('ecommerce · production');
  if (clear) {
    await user.click(screen.getByRole('button', { name: 'Clear frontend connection' }));
    expect(calInput).toHaveValue('');
  }
  await submitForm(user);

  expect((await readSavedCheck(read))?.labels).toEqual(
    clear ? SERVICE_AND_CUSTOM_LABELS : [{ name: 'feo11y_app_id', value: '230' }, ...SERVICE_AND_CUSTOM_LABELS]
  );
});

it('prevents viewers from changing or clearing connections', async () => {
  runTestAsViewer();
  await editConnections([...SERVICE_AND_CUSTOM_LABELS, { name: 'feo11y_app_id', value: '229' }]);

  expect(await screen.findByDisplayValue('banking · production')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Clear frontend connection' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'service_name value' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'namespace value' })).toBeDisabled();
  expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeDisabled();
});
