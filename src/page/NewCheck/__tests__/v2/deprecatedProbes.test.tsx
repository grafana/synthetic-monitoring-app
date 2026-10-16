import { act, screen, waitFor } from '@testing-library/react';
import { CHECKSTER_TEST_ID, ROUTER_TEST_ID } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { DEPRECATED_PROBE, PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';

import { CheckType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { QUERY_KEYS as PROBE_QUERY_KEYS } from 'data/useProbes';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { renderDuplicateFormV2, renderEditForm, renderNewForm } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const affectedCheck = {
  ...BASIC_HTTP_CHECK,
  // This journey does not exercise TLS; the factory may generate invalid PEM values.
  settings: { http: { ...BASIC_HTTP_CHECK.settings.http, tlsConfig: undefined } },
  alerts: undefined,
  probes: [DEPRECATED_PROBE.id!],
};

beforeEach(() => {
  server.use(apiRoute('listProbes', { result: () => ({ json: [DEPRECATED_PROBE, PRIVATE_PROBE] }) }));
});

it('creates checks using an eligible probe and prevents selecting a deprecated one', async () => {
  const { user, read } = await renderNewForm(CheckType.Http);
  await fillMandatoryFields({ user, checkType: CheckType.Http });
  expect(await screen.findByRole('checkbox', { name: /UAE/ })).toBeDisabled();
  await submitForm(user);
  await waitFor(() =>
    expect(screen.getByTestId(ROUTER_TEST_ID.pathname).textContent).toBe(
      generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_HTTP_CHECK.id! })
    )
  );
  const { body } = await read();
  expect(body.probes).toEqual([PRIVATE_PROBE.id]);
});

it('preserves an existing deprecated assignment when saving unrelated edits', async () => {
  const check = affectedCheck;
  server.use(apiRoute('listChecks', { result: () => ({ json: [check] }) }));
  const { user, read } = await renderEditForm(check.id);
  await gotoSection(user, FormSectionName.Check);
  await user.type(screen.getByLabelText(/Job name/), ' updated');
  await gotoSection(user, FormSectionName.Execution);
  expect(await screen.findByText('This check uses deprecated probes')).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /UAE/ })).toBeChecked();
  await submitForm(user);
  await waitFor(() =>
    expect(screen.getByTestId(ROUTER_TEST_ID.pathname).textContent).toBe(
      generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_HTTP_CHECK.id! })
    )
  );
  const { body } = await read();
  expect(body.probes).toEqual([DEPRECATED_PROBE.id]);
  expect(body.job).toBe(`${check.job} updated`);
});

it('requires a replacement when removing the last probe and saves the migration', async () => {
  const check = affectedCheck;
  server.use(apiRoute('listChecks', { result: () => ({ json: [check] }) }));
  const { user, read } = await renderEditForm(check.id);
  await gotoSection(user, FormSectionName.Execution);
  const deprecated = await screen.findByRole('checkbox', { name: /UAE/ });
  await user.click(deprecated);
  expect(await screen.findByText('At least one probe is required')).toBeInTheDocument();
  await user.click(deprecated);
  expect(deprecated).toBeChecked();
  await user.click(await screen.findByRole('checkbox', { name: new RegExp(PRIVATE_PROBE.name) }));
  await user.click(deprecated);
  await submitForm(user);
  await waitFor(() =>
    expect(screen.getByTestId(ROUTER_TEST_ID.pathname).textContent).toBe(
      generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_HTTP_CHECK.id! })
    )
  );
  const { body } = await read();
  expect(body.probes).toEqual([PRIVATE_PROBE.id]);
});

it('omits deprecated probes when duplicating and asks for a replacement instead of choosing one', async () => {
  const { user, read } = await renderDuplicateFormV2(affectedCheck, CheckType.Http);
  await gotoSection(user, FormSectionName.Execution);
  expect(await screen.findByText('Deprecated probes were not copied')).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /UAE/ })).toBeDisabled();
  expect(screen.getByRole('checkbox', { name: new RegExp(PRIVATE_PROBE.name) })).not.toBeChecked();
  await user.click(screen.getByRole('checkbox', { name: new RegExp(PRIVATE_PROBE.name) }));
  await waitFor(() => expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeEnabled());
  await submitForm(user);
  await waitFor(() =>
    expect(screen.getByTestId(ROUTER_TEST_ID.pathname).textContent).toBe(
      generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_HTTP_CHECK.id! })
    )
  );
  const { body } = await read();
  expect(body.probes).toEqual([PRIVATE_PROBE.id]);
});

it('blocks a newly selected probe deprecated during editing without discarding the draft', async () => {
  server.use(
    apiRoute('listProbes', { result: () => ({ json: [{ ...DEPRECATED_PROBE, deprecated: false }, PRIVATE_PROBE] }) })
  );
  const { user, queryClient } = await renderNewForm(CheckType.Http);
  await fillMandatoryFields({ user, checkType: CheckType.Http });
  await user.click(await screen.findByRole('checkbox', { name: /UAE/ }));
  server.use(apiRoute('listProbes', { result: () => ({ json: [DEPRECATED_PROBE, PRIVATE_PROBE] }) }));
  await act(async () => {
    await queryClient.invalidateQueries({ queryKey: PROBE_QUERY_KEYS.list });
  });
  await submitForm(user);
  expect(await screen.findByText(/Deprecated probes cannot be added to checks: UAE/)).toBeInTheDocument();
  await gotoSection(user, FormSectionName.Check);
  expect(screen.getByLabelText(/Job name/)).toHaveValue('JOB FIELD');
  await gotoSection(user, FormSectionName.Execution);
  await user.click(screen.getByRole('checkbox', { name: /UAE/ }));
  expect(screen.getByRole('checkbox', { name: /UAE/ })).toBeDisabled();
});
