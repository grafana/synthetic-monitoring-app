import React from 'react';
import { useAppPluginInstalled, usePluginComponent } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';

import { CONNECTED_SERVICES_TEST_ID } from './ConnectedServices.constants';
import { ExposedEntityGraphProps } from './ConnectedServicesEntityGraph';
import { ConnectedServicesMiniGraph } from './ConnectedServicesMiniGraph';
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

it('renders nothing when the KG does not expose the entity graph component', () => {
  // The inline section already shows the SM-owned graph; a drawer falling back to the same
  // renderer would only duplicate it, so without the exposed component there is no button.
  render(<ConnectedServicesMiniGraph check={LINKED_CHECK} />);

  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.miniGraphButton)).not.toBeInTheDocument();
});

/** Serves the exposed component for its ID only; everything else keeps the null default. */
function setExposedEntityGraph(Stub: React.ComponentType<ExposedEntityGraphProps>) {
  jest.mocked(usePluginComponent).mockImplementation((id: string) =>
    id === KG_ENTITY_GRAPH_COMPONENT_ID
      ? { component: Stub as React.ComponentType, isLoading: false }
      : { component: null, isLoading: false }
  );
}

it('opens the neighbourhood in a side drawer, giving the exposed graph the full column height', async () => {
  const received: ExposedEntityGraphProps[] = [];
  setExposedEntityGraph((props) => {
    received.push(props);
    return <div>exposed entity graph height:{String(props.height)}</div>;
  });
  const { user } = render(<ConnectedServicesMiniGraph check={LINKED_CHECK} />);

  await user.click(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.miniGraphButton));

  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.miniGraphDrawer)).toBeInTheDocument();
  expect(screen.getByText('exposed entity graph height:100%')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Open in Knowledge Graph/ })).toBeInTheDocument();

  const props = received.at(-1)!;
  expect(props.cypherQuery).toContain(`${BASIC_HTTP_CHECK.job}__${BASIC_HTTP_CHECK.target}`);
  // One hop of CALLS — the deeper neighbourhood proved too complex to read.
  expect(props.cypherQuery).toContain('(s1)-[:CALLS]-(neighbour:Service)');
  expect(props.start).toBe(Date.parse('2026-08-05T10:00:00Z'));
  expect(props.end).toBe(Date.parse('2026-08-05T11:00:00Z'));
  // Layered layout like the KG workbench's minigraph — the bounded neighbourhood reads as
  // ranked rows, not a force-simulation cluster.
  expect(props.layout).toEqual({ type: 'dagre', rankdir: 'TB' });
});

it('deep-links a node click into the KG entity drawer in a new tab', async () => {
  // A dependency's global types shadow `window.open`'s signature; the cast keeps the spy typed.
  const openSpy = jest.spyOn(window, 'open').mockImplementation((() => null) as never);
  setExposedEntityGraph(({ onNodeClick }) => (
    <button
      onClick={() =>
        onNodeClick?.({
          id: 'Service:frontend:prod::otel-demo',
          name: 'frontend',
          type: 'Service',
          scope: { env: 'prod', namespace: 'otel-demo' },
          properties: {},
        })
      }
    >
      frontend node
    </button>
  ));
  const { user } = render(<ConnectedServicesMiniGraph check={LINKED_CHECK} />);

  await user.click(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.miniGraphButton));
  await user.click(await screen.findByRole('button', { name: 'frontend node' }));

  expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('ed%5Bname%5D=frontend'), '_blank', 'noopener');
  expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('ed%5Bscope%5D%5Benv%5D=prod'), '_blank', 'noopener');
});

it('shows the service-link zero state in the drawer for an unlinked check', async () => {
  setExposedEntityGraph(() => <div>exposed entity graph</div>);
  const { user } = render(<ConnectedServicesMiniGraph check={{ ...BASIC_HTTP_CHECK, labels: [] }} />);

  await user.click(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.miniGraphButton));

  expect(await screen.findByText('Connect this check to a service')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Open in Knowledge Graph/ })).not.toBeInTheDocument();
});
