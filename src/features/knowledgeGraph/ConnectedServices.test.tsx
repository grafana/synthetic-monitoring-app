import React from 'react';
import { DataSourceInstanceSettings, LoadingState } from '@grafana/data';
import { config, useAppPluginInstalled } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { of, throwError } from 'rxjs';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { LOGS_DATASOURCE, METRICS_DATASOURCE, SM_DATASOURCE } from 'test/fixtures/datasources';
import { buildNeighbourhoodFrames } from 'test/fixtures/knowledgeGraph';
import { render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';
import { SMDataSource } from 'datasource/DataSource';

import { ConnectedServices } from './ConnectedServices';
import { CONNECTED_SERVICES_TEST_ID } from './ConnectedServices.constants';

const mockUseAppPluginInstalled = useAppPluginInstalled as jest.Mock;

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

it('can be collapsed and expanded again', async () => {
  setKgInstalled(true);
  const { user } = await renderSection(checkWithLabels([{ name: 'Team', value: 'platform' }]));

  await user.click(screen.getByRole('button', { name: 'Collapse connected services' }));
  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.zeroState)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Expand connected services' }));
  expect(screen.getByTestId(CONNECTED_SERVICES_TEST_ID.zeroState)).toBeInTheDocument();
});

it('renders the neighbourhood graph from the Cypher query result (linked check)', async () => {
  setKgInstalled(true);
  const { nodes, edges } = buildNeighbourhoodFrames();
  const query = jest.fn().mockReturnValue(of({ data: [nodes, edges], state: LoadingState.Done }));
  setKgDatasource(query);

  await renderSection(LINKED_CHECK);

  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.graph)).toBeInTheDocument();
  expect(screen.getAllByTestId(CONNECTED_SERVICES_TEST_ID.node)).toHaveLength(4);

  // Node labels from the frames.
  expect(screen.getByText('frontend')).toBeInTheDocument();
  expect(screen.getByText('cart')).toBeInTheDocument();
  expect(screen.getByText('gateway')).toBeInTheDocument();

  // The Cypher query was sent to the KG datasource, scoped to this check's entity name.
  const request = query.mock.calls[0][0];
  expect(request.targets[0]).toMatchObject({ queryType: 'entityGraph', queryMode: 'cypher' });
  expect(request.targets[0].cypherQuery).toContain(`${BASIC_HTTP_CHECK.job}__${BASIC_HTTP_CHECK.target}`);
});

it('shows the insights popup on node hover, with the deep link into the KG app', async () => {
  setKgInstalled(true);
  const { nodes, edges } = buildNeighbourhoodFrames();
  const query = jest.fn().mockReturnValue(of({ data: [nodes, edges], state: LoadingState.Done }));
  setKgDatasource(query);

  const { user } = await renderSection(LINKED_CHECK);
  await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.graph);

  await user.hover(screen.getByRole('button', { name: 'frontend (Service)' }));

  // The service's insights from the frames (insightNames field).
  expect(await screen.findByText('ErrorRatioBreach')).toBeInTheDocument();
  expect(screen.getByText('LatencyAverageBreach')).toBeInTheDocument();

  // The popup carries the entity deep link (clicking a node no longer navigates directly).
  // The section header has an "Open in Knowledge Graph" link too, so match on the drawer URL.
  const links = screen.getAllByRole('link', { name: /Open in Knowledge Graph/ });
  const popupLink = links.find((link) => link.getAttribute('href')?.includes('/entities?'));
  expect(popupLink).toBeDefined();
  expect(popupLink).toHaveAttribute('href', expect.stringContaining('ed%5Bname%5D=frontend'));
  expect(popupLink).toHaveAttribute('href', expect.stringContaining('ed%5Bscope%5D%5Benv%5D=prod'));
});

it('highlights an edge on hover and names the connection', async () => {
  setKgInstalled(true);
  const { nodes, edges } = buildNeighbourhoodFrames();
  const query = jest.fn().mockReturnValue(of({ data: [nodes, edges], state: LoadingState.Done }));
  setKgDatasource(query);

  const { user } = await renderSection(LINKED_CHECK);
  await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.graph);

  const edgeGroups = screen.getAllByTestId(CONNECTED_SERVICES_TEST_ID.edge);
  expect(edgeGroups).toHaveLength(3);

  // Every edge names its endpoints for the hover tooltip.
  const edgeTitles = edgeGroups.map((group) => group.querySelector('title')?.textContent);
  expect(edgeTitles).toContain('frontend → cart');

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
