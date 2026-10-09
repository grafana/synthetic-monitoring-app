import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK, BASIC_PING_CHECK } from 'test/fixtures/checks';
import { CHECK_IN_FORBIDDEN_FOLDER } from 'test/fixtures/folderChecks';
import { DEPRECATED_PROBE, PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsRBACReader } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { CheckList } from './CheckList';

const affected = { ...BASIC_HTTP_CHECK, job: 'Affected check', probes: [DEPRECATED_PROBE.id!], enabled: false };
const unaffected = { ...BASIC_PING_CHECK, job: 'Unaffected check', probes: [PRIVATE_PROBE.id!] };

function renderList(checks: Check[], search = '') {
  server.use(
    apiRoute('listChecks', { result: () => ({ json: checks }) }),
    apiRoute('listProbes', { result: () => ({ json: [DEPRECATED_PROBE, PRIVATE_PROBE] }) })
  );
  return render(<CheckList />, { route: AppRoutes.Checks, path: `${generateRoutePath(AppRoutes.Checks)}${search}` });
}

it('counts disabled affected checks even when filters hide them, and links to their probe filter', async () => {
  const { user } = renderList([affected, unaffected], '?search=Unaffected');
  expect(await screen.findByText('Move your checks off deprecated probes')).toBeInTheDocument();
  expect(screen.getByText(/1 check uses deprecated probes/)).toBeInTheDocument();
  expect(screen.queryByText('Affected check')).not.toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Review checks using UAE' }));
  expect(await screen.findByText('Affected check')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText('Unaffected check')).not.toBeInTheDocument());
});

it('does not prompt users without affected checks', async () => {
  renderList([unaffected]);
  await screen.findByText('Unaffected check');
  expect(screen.queryByText('Move your checks off deprecated probes')).not.toBeInTheDocument();
});

it('explains edit access while allowing readers to review affected checks', async () => {
  runTestAsRBACReader();
  renderList([affected]);
  expect(await screen.findByText(/You need edit access to update checks/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Review checks using UAE' })).toBeInTheDocument();
});

it('does not expose affected checks in forbidden folders', async () => {
  mockFeatureToggles({ [FeatureName.Folders]: true });
  renderList([unaffected, { ...CHECK_IN_FORBIDDEN_FOLDER, probes: [DEPRECATED_PROBE.id!] }]);
  await screen.findByText('Unaffected check');
  expect(screen.queryByText('Move your checks off deprecated probes')).not.toBeInTheDocument();
});
