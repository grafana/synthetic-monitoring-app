import React from 'react';
import { useAppPluginInstalled } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { Check } from 'types';

import { ConnectedServices } from './ConnectedServices';
import { CONNECTED_SERVICES_TEST_ID } from './ConnectedServices.constants';

const mockUseAppPluginInstalled = useAppPluginInstalled as jest.Mock;

function setKgInstalled(value: boolean) {
  mockUseAppPluginInstalled.mockReturnValue({ loading: false, error: undefined, value });
}

function checkWithLabels(labels: Check['labels']): Check {
  return { ...BASIC_HTTP_CHECK, labels };
}

it('renders nothing when the Knowledge Graph app is not installed', async () => {
  setKgInstalled(false);
  render(<ConnectedServices check={checkWithLabels([{ name: 'service_name', value: 'frontend' }])} />);

  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.section)).not.toBeInTheDocument();
});

it('is collapsed by default and reveals the zero state when expanded (unlinked check)', async () => {
  setKgInstalled(true);
  const { user } = render(<ConnectedServices check={checkWithLabels([{ name: 'Team', value: 'platform' }])} />);

  // The section header is present but the body (and therefore the zero state) is hidden until expanded.
  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.section)).toBeInTheDocument();
  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.zeroState)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Expand connected services' }));

  expect(screen.getByTestId(CONNECTED_SERVICES_TEST_ID.zeroState)).toBeInTheDocument();
  expect(screen.getByText('Connect this check to a service')).toBeInTheDocument();
  // The CTA deep links to the Labels section of the edit form, where the KG service link lives.
  expect(screen.getByRole('link', { name: /Add service link/ })).toHaveAttribute(
    'href',
    expect.stringContaining('/edit?section=labels')
  );
});

// Note: the linked path (rendering the node graph itself) depends on the Knowledge Graph scenes
// datasource and a SceneContext, so it is validated against a live stack rather than here. These
// tests cover the gating and zero-state logic that determines whether the graph is shown at all.

it('can be collapsed again after expanding', async () => {
  setKgInstalled(true);
  const { user } = render(<ConnectedServices check={checkWithLabels([{ name: 'Team', value: 'platform' }])} />);

  await user.click(await screen.findByRole('button', { name: 'Expand connected services' }));
  expect(screen.getByTestId(CONNECTED_SERVICES_TEST_ID.zeroState)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Collapse connected services' }));
  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.zeroState)).not.toBeInTheDocument();
});
