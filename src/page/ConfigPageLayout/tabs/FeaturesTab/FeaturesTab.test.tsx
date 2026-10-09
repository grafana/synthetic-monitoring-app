import React from 'react';
import { screen, within } from '@testing-library/react';
import { getBrowserFlagOverrideStorageKey } from 'services/featureFlags';
import { render } from 'test/render';
import { mockFeatureToggles, runTestAsSMAdmin, runTestAsSMViewer } from 'test/utils';

import { FeatureName } from 'types';

import { FeaturesTab } from './FeaturesTab';

const FOLDERS_KEY = getBrowserFlagOverrideStorageKey('synthetic-monitoring.folders');
const GRPC_KEY = getBrowserFlagOverrideStorageKey('synthetic-monitoring.grpc-checks');
const SCREENSHOTS_KEY = getBrowserFlagOverrideStorageKey('synthetic-monitoring.screenshots');

async function renderTab() {
  const result = render(<FeaturesTab />);
  await screen.findByRole('list', { name: 'Features' });
  return result;
}

describe('FeaturesTab', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('lists the switchable features', async () => {
    runTestAsSMAdmin();
    await renderTab();

    expect(screen.getByLabelText('Folders')).toBeInTheDocument();
    expect(screen.getByLabelText('gRPC checks')).toBeInTheDocument();
  });

  it('shows the release stage of each feature', async () => {
    runTestAsSMAdmin();
    await renderTab();

    const screenshotsRow = screen.getByLabelText('Browser check screenshots').closest('li')!;
    const grpcRow = screen.getByLabelText('gRPC checks').closest('li')!;

    expect(within(screenshotsRow).getByText('Private preview')).toBeInTheDocument();
    expect(within(grpcRow).getByText('Experimental')).toBeInTheDocument();
  });

  it('saves a browser override when an admin enables a preview feature', async () => {
    runTestAsSMAdmin();
    const { user } = await renderTab();

    await user.click(screen.getByLabelText('Folders'));

    expect(localStorage.getItem(FOLDERS_KEY)).toBe('true');
    expect(screen.getByLabelText('Folders')).toBeChecked();
    expect(screen.getByText('Overridden in this browser')).toBeInTheDocument();
  });

  it('asks for confirmation before enabling an experimental feature', async () => {
    runTestAsSMAdmin();
    const { user } = await renderTab();

    await user.click(screen.getByLabelText('gRPC checks'));

    expect(await screen.findByRole('dialog', { name: /Enable gRPC checks/ })).toBeInTheDocument();
    expect(localStorage.getItem(GRPC_KEY)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Enable' }));

    expect(localStorage.getItem(GRPC_KEY)).toBe('true');
    expect(screen.getByLabelText('gRPC checks')).toBeChecked();
  });

  it('does not save an experimental feature when the confirmation is cancelled', async () => {
    runTestAsSMAdmin();
    const { user } = await renderTab();

    await user.click(screen.getByLabelText('gRPC checks'));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(localStorage.getItem(GRPC_KEY)).toBeNull();
    expect(screen.getByLabelText('gRPC checks')).not.toBeChecked();
  });

  it('shows an existing browser override', async () => {
    runTestAsSMAdmin();
    localStorage.setItem(SCREENSHOTS_KEY, 'true');
    await renderTab();

    expect(screen.getByLabelText('Browser check screenshots')).toBeChecked();
    expect(screen.getByLabelText('Folders')).not.toBeChecked();
    expect(screen.getByText('Overridden in this browser')).toBeInTheDocument();
  });

  it('resets an override back to the Grafana value', async () => {
    runTestAsSMAdmin();
    localStorage.setItem(SCREENSHOTS_KEY, 'true');
    const { user } = await renderTab();

    await user.click(screen.getByRole('button', { name: 'Reset Browser check screenshots' }));

    expect(localStorage.getItem(SCREENSHOTS_KEY)).toBeNull();
    expect(screen.getByLabelText('Browser check screenshots')).not.toBeChecked();
    expect(screen.queryByText('Overridden in this browser')).not.toBeInTheDocument();
  });

  it('lets an admin turn off a feature Grafana has enabled', async () => {
    runTestAsSMAdmin();
    mockFeatureToggles({ [FeatureName.Folders]: true });
    const { user } = await renderTab();

    expect(screen.getByLabelText('Folders')).toBeChecked();
    expect(screen.getByText('Enabled by Grafana')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Folders'));

    expect(localStorage.getItem(FOLDERS_KEY)).toBe('false');
    expect(screen.getByLabelText('Folders')).not.toBeChecked();
    expect(screen.queryByText('Enabled by Grafana')).not.toBeInTheDocument();
  });

  it('does not let non-admins change features', async () => {
    runTestAsSMViewer();
    await renderTab();

    expect(screen.getByText('Only organization admins can change feature settings.')).toBeInTheDocument();
    expect(screen.getByLabelText('Folders')).toBeDisabled();
  });

  it('shows a message when no features match the search', async () => {
    runTestAsSMAdmin();
    const { user } = await renderTab();

    await user.type(screen.getByPlaceholderText('Search features'), 'nothing like this');

    expect(screen.getByText(/No features match/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByLabelText('Folders')).toBeInTheDocument();
  });
});
