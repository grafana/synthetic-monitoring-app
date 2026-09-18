import React from 'react';
import { useAppPluginInstalled, usePluginComponent } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';

import { CONNECTED_SERVICES_TEST_ID } from './ConnectedServices.constants';
import { ConnectedServicesMiniGraph } from './ConnectedServicesMiniGraph';
import { ExposedEntityGraphProps } from './ConnectedServicesEntityGraph';
import { KG_ENTITY_GRAPH_COMPONENT_ID } from './knowledgeGraph';

const mockUseAppPluginInstalled = useAppPluginInstalled as jest.Mock;

jest.mock('@grafana/scenes-react', () => {
  const { dateTime: mockDateTime } = jest.requireActual('@grafana/data');
  const mockTimeRange = {
    from: mockDateTime('2026-08-05T10:00:00Z'),
    to: mockDateTime('2026-08-05T11:00:00Z'),
    raw: { from: 'now-1h', to: 'now' },
  };

  return {
    ...jest.requireActual('@grafana/scenes-react'),
    useTimeRange: jest.fn(() => [mockTimeRange, jest.fn()]),
  };
});

const LINKED_CHECK: Check = {
  ...BASIC_HTTP_CHECK,
  labels: [
    { name: 'service_name', value: 'frontend' },
    { name: 'namespace', value: 'otel-demo' },
  ],
};

beforeEach(() => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
  mockUseAppPluginInstalled.mockReturnValue({ loading: false, error: undefined, value: true });
});

afterEach(() => {
  jest.mocked(usePluginComponent).mockImplementation(() => ({ component: null, isLoading: false }));
});

it('renders nothing when the Knowledge Graph is not enabled', () => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: false });
  render(<ConnectedServicesMiniGraph check={LINKED_CHECK} />);

  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.miniGraphButton)).not.toBeInTheDocument();
});

it('opens the neighbourhood in a side drawer, giving the graph the full column height', async () => {
  jest.mocked(usePluginComponent).mockImplementation((id: string) =>
    id === KG_ENTITY_GRAPH_COMPONENT_ID
      ? {
          component: (({ height }: ExposedEntityGraphProps) => (
            <div>exposed entity graph height:{String(height)}</div>
          )) as React.ComponentType,
          isLoading: false,
        }
      : { component: null, isLoading: false }
  );
  const { user } = render(<ConnectedServicesMiniGraph check={LINKED_CHECK} />);

  await user.click(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.miniGraphButton));

  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.miniGraphDrawer)).toBeInTheDocument();
  expect(screen.getByText('exposed entity graph height:100%')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Open in Knowledge Graph/ })).toBeInTheDocument();
});

it('shows the service-link zero state in the drawer for an unlinked check', async () => {
  const { user } = render(<ConnectedServicesMiniGraph check={{ ...BASIC_HTTP_CHECK, labels: [] }} />);

  await user.click(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.miniGraphButton));

  expect(await screen.findByText('Connect this check to a service')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Open in Knowledge Graph/ })).not.toBeInTheDocument();
});
