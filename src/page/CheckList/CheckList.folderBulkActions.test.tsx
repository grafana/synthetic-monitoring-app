import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { CHECK_IN_PRODUCTION, CHECK_IN_STAGING } from 'test/fixtures/folderChecks';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { CheckList } from './CheckList';

const renderCheckList = async (checks: Check[]) => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => ({ json: checks }),
    }),
    apiRoute(`listProbes`, {
      result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }),
    })
  );

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path: generateRoutePath(AppRoutes.Checks),
  });

  expect(await screen.findByText('Create new check')).toBeInTheDocument();
  return res;
};

describe('CheckList - Per-folder Bulk Actions', () => {
  beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

  it('shows a select-all checkbox in each folder header', async () => {
    await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_STAGING]);

    expect(await screen.findByLabelText('Select all checks in Production')).toBeInTheDocument();
    expect(screen.getByLabelText('Select all checks in Staging')).toBeInTheDocument();
  });

  it('shows selected count and inline bulk actions when folder checkbox is clicked', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Production');
    await user.click(folderCheckbox);

    const selectedLabel = await screen.findByText('1 selected');
    const folderActions = selectedLabel.closest('div')!;

    expect(within(folderActions).getByRole('button', { name: 'Move to folder' })).toBeInTheDocument();
    expect(within(folderActions).getByRole('button', { name: 'Enable' })).toBeInTheDocument();
    expect(within(folderActions).getByRole('button', { name: 'Disable' })).toBeInTheDocument();
    expect(within(folderActions).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('deselects all checks when the folder checkbox is clicked again', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Production');
    await user.click(folderCheckbox);
    expect(await screen.findByText('1 selected')).toBeInTheDocument();

    await user.click(folderCheckbox);
    await waitFor(() => {
      expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
    });
  });

  it('selects individual check checkboxes when folder select-all is clicked', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Production');
    await user.click(folderCheckbox);

    await waitFor(() => {
      const checkCheckboxes = screen.getAllByLabelText('Select check');
      checkCheckboxes.forEach((cb) => expect(cb).toBeChecked());
    });
  });

  it('does not show bulk actions when no checks are selected in folder', async () => {
    await renderCheckList([CHECK_IN_PRODUCTION]);

    await screen.findByLabelText('Select all checks in Production');
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it('shows per-folder actions for multiple folders independently', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_STAGING]);

    const productionCheckbox = await screen.findByLabelText('Select all checks in Production');
    await user.click(productionCheckbox);

    expect(await screen.findByText('1 selected')).toBeInTheDocument();

    const stagingCheckbox = screen.getByLabelText('Select all checks in Staging');
    expect(stagingCheckbox).not.toBeChecked();
  });
});
