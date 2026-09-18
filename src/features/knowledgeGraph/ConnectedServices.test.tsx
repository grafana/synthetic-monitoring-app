import React from 'react';
import { DataSourceInstanceSettings, LoadingState } from '@grafana/data';
import { config, useAppPluginInstalled, usePluginComponent } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { of, throwError } from 'rxjs';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { LOGS_DATASOURCE, METRICS_DATASOURCE, SM_DATASOURCE } from 'test/fixtures/datasources';
import { buildNeighbourhoodFrames, FRONTEND_ASSERTION_TIMELINES } from 'test/fixtures/knowledgeGraph';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';
import { SMDataSource } from 'datasource/DataSource';

import { ConnectedServices } from './ConnectedServices';
import { CONNECTED_SERVICES_TEST_ID } from './ConnectedServices.constants';
import { ExposedEntityGraphProps } from './ConnectedServicesEntityGraph';
import { parseGraphFrames } from './ConnectedServices.utils';
import { ConnectedServicesGraph } from './ConnectedServicesGraph';
import { KG_ENTITY_GRAPH_COMPONENT_ID } from './knowledgeGraph';

const mockUseAppPluginInstalled = useAppPluginInstalled as jest.Mock;

// The section lives inside the scene-based check dashboard; its KG query follows the
// dashboard's time range, provided by scenes-react. Fixed here so tests can assert on it.
const MOCK_TIME_RANGE_FROM = '2026-08-05T10:00:00Z';
const MOCK_TIME_RANGE_TO = '2026-08-05T11:00:00Z';

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

const KG_DATASOURCE = {
  uid: 'grafanacloud-knowledgegraph',
  type: 'grafana-knowledgegraph-datasource',
  name: 'Knowledge Graph',
} as DataSourceInstanceSettings;

function setKgInstalled(value: boolean) {
  mockUseAppPluginInstalled.mockReturnValue({ loading: false, error: undefined, value });
}

/**
 * Registers the KG datasource (so `useKGDS` resolves it) and stubs its `query` method with the
 * given implementation. Restored by the global afterEach (restoreAllMocks + the delete below).
 *
 * The spy goes on `jest.requireMock`'s module object: spying on an `import * as` namespace
 * doesn't work here because the SWC interop hands the test a copy of the module exports.
 */
function setKgDatasource(query: jest.Mock) {
  config.datasources[KG_DATASOURCE.name] = KG_DATASOURCE;
  jest.spyOn(jest.requireMock('@grafana/runtime'), 'getDataSourceSrv').mockReturnValue({
    getList: () => [METRICS_DATASOURCE, LOGS_DATASOURCE, SM_DATASOURCE],
    // Serve the stubbed KG datasource for KG lookups; everything else (e.g. the SM datasource
    // the test providers resolve) keeps the default behaviour from the global runtime mock.
    get: jest.fn((ref?: unknown) => {
      const uid = typeof ref === 'object' && ref !== null ? (ref as { uid?: string }).uid : ref;
      if (uid === KG_DATASOURCE.uid) {
        return Promise.resolve({ query });
      }
      return Promise.resolve(new SMDataSource(SM_DATASOURCE));
    }),
  });
}

beforeEach(() => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
});

afterEach(() => {
  delete config.datasources[KG_DATASOURCE.name];
});

function checkWithLabels(labels: Check['labels']): Check {
  return { ...BASIC_HTTP_CHECK, labels };
}

const LINKED_CHECK = checkWithLabels([
  { name: 'service_name', value: 'frontend' },
  { name: 'namespace', value: 'otel-demo' },
]);

async function renderSection(check: Check) {
  const result = render(<ConnectedServices check={check} />);
  await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.section);
  return result;
}

/**
 * Renders the section for a linked check with the KG serving the fixture neighbourhood, waited on
 * until the graph is up. Returns the datasource `query` spy alongside the render result.
 */
async function renderGraph(check: Check = LINKED_CHECK) {
  setKgInstalled(true);
  const { nodes, edges } = buildNeighbourhoodFrames();
  const query = jest.fn().mockReturnValue(of({ data: [nodes, edges], state: LoadingState.Done }));
  setKgDatasource(query);

  const result = await renderSection(check);
  await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.graph);

  return { ...result, query };
}

it('renders nothing when the Knowledge Graph app is not installed', async () => {
  setKgInstalled(false);
  render(<ConnectedServices check={LINKED_CHECK} />);

  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.section)).not.toBeInTheDocument();
});

it('renders nothing when the feature flag is disabled, even with the app installed', async () => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: false });
  setKgInstalled(true);
  render(<ConnectedServices check={LINKED_CHECK} />);

  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.section)).not.toBeInTheDocument();
});

it('is expanded on load and shows the zero state for an unlinked check', async () => {
  setKgInstalled(true);
  await renderSection(checkWithLabels([{ name: 'Team', value: 'platform' }]));

  expect(screen.getByTestId(CONNECTED_SERVICES_TEST_ID.zeroState)).toBeInTheDocument();
  expect(screen.getByText('Connect this check to a service')).toBeInTheDocument();
  // The CTA deep links to the Labels section of the edit form, where the KG service link lives.
  expect(screen.getByRole('link', { name: /Add service link/ })).toHaveAttribute(
    'href',
    expect.stringContaining('/edit?section=labels')
  );
});

it('renders the feature feedback widget in the section header', async () => {
  setKgInstalled(true);
  await renderSection(checkWithLabels([{ name: 'Team', value: 'platform' }]));

  expect(screen.getByText('New feature!')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'I love this feature' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: "I don't like this feature" })).toBeInTheDocument();
});

it('can be collapsed and expanded again', async () => {
  setKgInstalled(true);
  const { user } = await renderSection(checkWithLabels([{ name: 'Team', value: 'platform' }]));

  const toggle = screen.getByRole('button', { name: 'Connected services' });
  expect(toggle).toHaveAttribute('aria-expanded', 'true');

  await user.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.zeroState)).not.toBeInTheDocument();

  await user.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByTestId(CONNECTED_SERVICES_TEST_ID.zeroState)).toBeInTheDocument();
});

it('renders the neighbourhood graph from the Cypher query result (linked check)', async () => {
  const { query } = await renderGraph();

  // Every node names itself in full on hover, namespaced the way the KG labels its own nodes.
  const nodeGlyphs = screen.getAllByTestId(CONNECTED_SERVICES_TEST_ID.node);
  expect(nodeGlyphs).toHaveLength(4);
  const nodeNames = nodeGlyphs.map((node) => node.querySelector('title')?.textContent);
  expect(nodeNames).toEqual(
    expect.arrayContaining([
      'my check__https://grafana.com',
      'otel-demo/frontend',
      'otel-demo/cart',
      'otel-demo/gateway',
    ])
  );

  // A check has no namespace to prefix, and its long composite name wraps rather than being cut off.
  const checkNode = nodeGlyphs.find((node) => node.querySelector('title')?.textContent?.startsWith('my check'))!;
  const checkLabelLines = Array.from(checkNode.querySelectorAll('tspan')).map((line) => line.textContent);
  expect(checkLabelLines).toEqual(['my check__https://', 'grafana.com']);

  // The Cypher query was sent to the KG datasource, scoped to this check's entity name and
  // the dashboard's time range.
  const request = query.mock.calls[0][0];
  expect(request.targets[0]).toMatchObject({ queryType: 'entityGraph', queryMode: 'cypher' });
  expect(request.targets[0].cypherQuery).toContain(`${BASIC_HTTP_CHECK.job}__${BASIC_HTTP_CHECK.target}`);
  expect(request.range.from.valueOf()).toBe(Date.parse(MOCK_TIME_RANGE_FROM));
  expect(request.range.to.valueOf()).toBe(Date.parse(MOCK_TIME_RANGE_TO));
});

it('opens the insights card on node click, with the deep link into the KG app', async () => {
  const { user } = await renderGraph();

  await user.click(screen.getByRole('button', { name: 'otel-demo/frontend (Service)' }));

  // The service's insights from the frames (insightNames field).
  expect(await screen.findByText('ErrorRatioBreach')).toBeInTheDocument();
  expect(screen.getByText('LatencyAverageBreach')).toBeInTheDocument();

  // The card carries the entity deep link (clicking a node no longer navigates directly).
  // The section header has an "Open in Knowledge Graph" link too, so match on the drawer URL.
  const links = screen.getAllByRole('link', { name: /Open in Knowledge Graph/ });
  const cardLink = links.find((link) => link.getAttribute('href')?.includes('ed%5Bname%5D'));
  expect(cardLink).toBeDefined();
  expect(cardLink).toHaveAttribute('href', expect.stringContaining('ed%5Bname%5D=frontend'));
  expect(cardLink).toHaveAttribute('href', expect.stringContaining('ed%5Bscope%5D%5Benv%5D=prod'));
});

it('keeps the insights card open until it is dismissed', async () => {
  const { user } = await renderGraph();

  const node = screen.getByRole('button', { name: 'otel-demo/frontend (Service)' });
  await user.click(node);
  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.nodeCard)).toBeInTheDocument();

  // Moving the cursor away no longer closes it — that was the fragile part of the hover popup.
  await user.unhover(node);
  expect(screen.getByTestId(CONNECTED_SERVICES_TEST_ID.nodeCard)).toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.nodeCard)).not.toBeInTheDocument();
});

it('opens the insights card from the keyboard', async () => {
  const { user } = await renderGraph();

  const node = screen.getByRole('button', { name: 'otel-demo/frontend (Service)' });
  node.focus();
  await user.keyboard('{Enter}');

  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.nodeCard)).toBeInTheDocument();
});

it('links the section header to this check and its services in the KG entity graph', async () => {
  setKgInstalled(true);
  await renderSection(LINKED_CHECK);

  const headerLink = screen.getByRole('link', { name: /Open in Knowledge Graph/ });
  const params = new URLSearchParams(headerLink.getAttribute('href')!.split('?')[1]);

  expect(params.get('filterCriteria[0][entityType]')).toBe('SyntheticCheck');
  expect(params.get('filterCriteria[0][propertyMatchers][0][value]')).toBe(
    `${BASIC_HTTP_CHECK.job}__${BASIC_HTTP_CHECK.target}`
  );
  expect(params.get('filterCriteria[0][connectToEntityTypes][0]')).toBe('Service');
  expect(params.get('view')).toBe('graph');
});

it('highlights an edge on hover and names the connection', async () => {
  const { user } = await renderGraph();

  const edgeGroups = screen.getAllByTestId(CONNECTED_SERVICES_TEST_ID.edge);
  expect(edgeGroups).toHaveLength(3);

  // Every edge names its endpoints for the hover tooltip, env-qualified for services so the
  // parallel edges to a service's environment twins are tellable apart.
  const edgeTitles = edgeGroups.map((group) => group.querySelector('title')?.textContent);
  expect(edgeTitles).toContain('otel-demo/frontend (prod) → otel-demo/cart (prod)');

  await user.hover(edgeGroups[0]);

  // The hovered edge's visible path is emphasized while the others fade back.
  const visiblePathOf = (group: Element) => group.querySelectorAll('path')[1];
  expect(visiblePathOf(edgeGroups[0])).toHaveAttribute('stroke-width', '2');
  expect(visiblePathOf(edgeGroups[1])).toHaveAttribute('opacity', '0.3');

  await user.unhover(edgeGroups[0]);
  expect(visiblePathOf(edgeGroups[0])).toHaveAttribute('stroke-width', '1.5');
  expect(visiblePathOf(edgeGroups[1])).toHaveAttribute('opacity', '1');
});

it('shows the not-discovered-yet message when the query returns no entities', async () => {
  setKgInstalled(true);
  const query = jest.fn().mockReturnValue(of({ data: [], state: LoadingState.Done }));
  setKgDatasource(query);

  await renderSection(LINKED_CHECK);

  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.empty)).toBeInTheDocument();
});

it('shows the error state with a retry action when the query fails', async () => {
  setKgInstalled(true);
  const query = jest.fn().mockReturnValue(throwError(() => new Error('knowledge graph unavailable')));
  setKgDatasource(query);

  await renderSection(LINKED_CHECK);

  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.error)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});

it('labels environments only for repeated service names and renders edges without arrowheads', async () => {
  const { nodes, edges } = buildNeighbourhoodFrames();
  const graph = parseGraphFrames([nodes, edges]);
  const service = graph.nodes[1];
  graph.nodes.push({ ...service, id: 'frontend-staging', scope: { ...service.scope, env: 'staging' } });
  graph.edges.push({ id: 'staging-check', source: 'frontend-staging', target: graph.nodes[0].id });
  const { container } = render(<ConnectedServicesGraph neighbourhood={graph} />);
  await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.graph);

  expect(screen.getByRole('button', { name: 'otel-demo/frontend · Env: prod (Service)' })).toHaveTextContent(
    'Env: prod'
  );
  expect(screen.getByRole('button', { name: 'otel-demo/frontend · Env: staging (Service)' })).toHaveTextContent(
    'Env: staging'
  );
  expect(screen.getByRole('button', { name: 'otel-demo/cart (Service)' })).not.toHaveTextContent('Env:');
  expect(container.querySelector('marker, [marker-end]')).toBeNull();
  const titles = screen
    .getAllByTestId(CONNECTED_SERVICES_TEST_ID.edge)
    .map((edge) => edge.querySelector('title')?.textContent);
  expect(titles).toContain('otel-demo/frontend (prod) → my check__https://grafana.com');
});

it('states the environment fan-out on the check card when the link matches several env twins', async () => {
  const { nodes, edges } = buildNeighbourhoodFrames();
  const graph = parseGraphFrames([nodes, edges]);
  const service = graph.nodes[1];
  graph.nodes.push({ ...service, id: 'frontend-staging', scope: { ...service.scope, env: 'staging' } });
  graph.edges.push({ id: 'staging-check', source: 'frontend-staging', target: graph.nodes[0].id });
  const { user } = render(<ConnectedServicesGraph neighbourhood={graph} />);
  await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.graph);

  await user.click(screen.getByRole('button', { name: 'my check__https://grafana.com (SyntheticCheck)' }));
  expect(
    await screen.findByText('Linked to otel-demo/frontend in 2 environments: prod, staging')
  ).toBeInTheDocument();

  // A service card carries no fan-out note — it belongs to exactly one environment.
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'otel-demo/frontend · Env: prod (Service)' }));
  expect(screen.queryByText(/Linked to/)).not.toBeInTheDocument();
});

it('splits own vs check-propagated insights into rings and card groups from one batched lookup', async () => {
  const requests: Request[] = [];
  server.use(
    apiRoute('getKGAssertionOrigins', { result: () => ({ json: FRONTEND_ASSERTION_TIMELINES }) }, (req) =>
      requests.push(req)
    )
  );
  const { user } = await renderGraph();

  // The propagated insight surfaces as the inset connected ring, on the one service carrying it.
  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.nodeConnectedRing)).toBeInTheDocument();
  expect(screen.getAllByTestId(CONNECTED_SERVICES_TEST_ID.nodeConnectedRing)).toHaveLength(1);

  // Fetched on render (the rings need it), batched to every service — a propagated insight can
  // exist on a service whose frame carries no own insight names at all.
  expect(requests).toHaveLength(1);
  expect(await requests[0].json()).toEqual({
    startTime: Date.parse(MOCK_TIME_RANGE_FROM),
    endTime: Date.parse(MOCK_TIME_RANGE_TO),
    entityKeys: [
      { type: 'Service', name: 'frontend', scope: { env: 'prod', namespace: 'otel-demo' } },
      { type: 'Service', name: 'cart', scope: { env: 'prod', namespace: 'otel-demo' } },
      { type: 'Service', name: 'gateway', scope: { env: 'prod', namespace: 'otel-demo' } },
    ],
    includeConnectedAssertions: true,
  });

  // The card groups the split the way the KG's drawer does. The group label alone carries the
  // provenance — the panel always renders alongside a specific check, so rows don't repeat it.
  // The propagated group includes the timeline-only insight the frame's insightNames omitted.
  await user.click(screen.getByRole('button', { name: 'otel-demo/frontend (Service)' }));
  expect(await screen.findByText('Service insights')).toBeInTheDocument();
  expect(screen.getByText('LatencyAverageBreach')).toBeInTheDocument();
  expect(screen.getByText('Propagated from check')).toBeInTheDocument();
  expect(screen.getByText('ErrorRatioBreach')).toBeInTheDocument();
  expect(screen.getByText('check_failures::SyntheticCheckFailedExecutionsBreach')).toBeInTheDocument();
  expect(screen.queryByText(/From check:/)).not.toBeInTheDocument();
});

it('keeps graph insights and the KG link available when origin lookup fails', async () => {
  server.use(apiRoute('getKGAssertionOrigins', { result: () => ({ status: 403, json: { message: 'Forbidden' } }) }));
  const { user } = await renderGraph();
  await user.click(screen.getByRole('button', { name: 'otel-demo/frontend (Service)' }));
  expect(await screen.findByText('Insight origin unavailable')).toBeInTheDocument();
  // Without the split, the card falls back to the frame's flat insight list and no connected
  // ring renders — the frame's mixed severity ring stands alone.
  expect(screen.getByText('ErrorRatioBreach')).toBeInTheDocument();
  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.nodeConnectedRing)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Open in Knowledge Graph/ })).toBeInTheDocument();
});

describe('with the KG-exposed Entity Graph component available', () => {
  /** Serves the exposed component for its ID only; everything else keeps the null default. */
  function setExposedEntityGraph(Stub: React.ComponentType<ExposedEntityGraphProps>) {
    jest.mocked(usePluginComponent).mockImplementation((id: string) =>
      id === KG_ENTITY_GRAPH_COMPONENT_ID
        ? { component: Stub as React.ComponentType, isLoading: false }
        : { component: null, isLoading: false }
    );
  }

  afterEach(() => {
    jest.mocked(usePluginComponent).mockImplementation(() => ({ component: null, isLoading: false }));
  });

  it('prefers the exposed component over the SM-owned renderer, passing query and range', async () => {
    setKgInstalled(true);
    const received: ExposedEntityGraphProps[] = [];
    setExposedEntityGraph((props) => {
      received.push(props);
      return <div>exposed entity graph</div>;
    });

    await renderSection(LINKED_CHECK);

    expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.exposedGraph)).toBeInTheDocument();
    expect(screen.getByText('exposed entity graph')).toBeInTheDocument();
    // The SM-owned renderer (and its Cypher fetch) stays unmounted.
    expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.graph)).not.toBeInTheDocument();

    const props = received.at(-1)!;
    expect(props.cypherQuery).toContain(`${BASIC_HTTP_CHECK.job}__${BASIC_HTTP_CHECK.target}`);
    expect(props.start).toBe(Date.parse(MOCK_TIME_RANGE_FROM));
    expect(props.end).toBe(Date.parse(MOCK_TIME_RANGE_TO));
    expect(props.height).toBe(280);
  });

  it('deep-links a node click into the KG entity drawer in a new tab', async () => {
    setKgInstalled(true);
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
    const { user } = await renderSection(LINKED_CHECK);

    await user.click(await screen.findByRole('button', { name: 'frontend node' }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('ed%5Bname%5D=frontend'),
      '_blank',
      'noopener'
    );
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('ed%5Bscope%5D%5Benv%5D=prod'),
      '_blank',
      'noopener'
    );
  });
});
