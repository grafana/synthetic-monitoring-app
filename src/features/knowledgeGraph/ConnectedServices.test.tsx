import React from 'react';
import { useAppPluginInstalled, usePluginComponent } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';

import { ConnectedServices } from './ConnectedServices';
import { CONNECTED_SERVICES_TEST_ID } from './ConnectedServices.constants';
import { ExposedMiniGraphProps } from './ConnectedServicesMiniGraph';
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

function setKgInstalled(value: boolean) {
  mockUseAppPluginInstalled.mockReturnValue({ loading: false, error: undefined, value });
}

/** Serves the exposed mini graph for its ID only; everything else keeps the null default. */
function setExposedMiniGraph(Stub: React.ComponentType<ExposedMiniGraphProps>) {
  jest.mocked(usePluginComponent).mockImplementation((id: string) =>
    id === KG_ENTITY_GRAPH_COMPONENT_ID
      ? { component: Stub as React.ComponentType, isLoading: false }
      : { component: null, isLoading: false }
  );
}

beforeEach(() => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
  setKgInstalled(true);
  setExposedMiniGraph(() => <div>exposed mini graph</div>);
});

afterEach(() => {
  jest.mocked(usePluginComponent).mockImplementation(() => ({ component: null, isLoading: false }));
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
  render(<ConnectedServices check={LINKED_CHECK} />);

  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.section)).not.toBeInTheDocument();
});

it('renders nothing when the KG does not expose the mini graph (asserts app predating it)', async () => {
  // The exposed component is the section's only renderer — no SM-owned fallback.
  jest.mocked(usePluginComponent).mockImplementation(() => ({ component: null, isLoading: false }));
  render(<ConnectedServices check={LINKED_CHECK} />);

  expect(screen.queryByTestId(CONNECTED_SERVICES_TEST_ID.section)).not.toBeInTheDocument();
});

it('is expanded on load and shows the zero state for an unlinked check', async () => {
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
  await renderSection(checkWithLabels([{ name: 'Team', value: 'platform' }]));

  expect(screen.getByText('New feature!')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'I love this feature' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: "I don't like this feature" })).toBeInTheDocument();
});

it('can be collapsed and expanded again', async () => {
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

it('renders the exposed mini graph for a linked check, check-anchored and top-to-bottom', async () => {
  const received: ExposedMiniGraphProps[] = [];
  setExposedMiniGraph((props) => {
    received.push(props);
    return <div>exposed mini graph</div>;
  });

  await renderSection(LINKED_CHECK);

  expect(await screen.findByTestId(CONNECTED_SERVICES_TEST_ID.exposedGraph)).toBeInTheDocument();
  expect(screen.getByText('exposed mini graph')).toBeInTheDocument();

  const props = received.at(-1)!;
  expect(props.cypherQuery).toContain(`${BASIC_HTTP_CHECK.job}__${BASIC_HTTP_CHECK.target}`);
  // Preserve services without CALLS neighbours while expanding at most one hop.
  expect(props.cypherQuery).toContain('MATCH (s1)-[:CALLS*0..1]-(neighbour:Service)');
  expect(props.start).toBe(Date.parse(MOCK_TIME_RANGE_FROM));
  expect(props.end).toBe(Date.parse(MOCK_TIME_RANGE_TO));
  // The check anchors the ranked layout (first rank + halo); TB puts the shallow neighbourhood's
  // sibling fan on the horizontal axis.
  expect(props.focusEntity).toEqual({
    type: 'SyntheticCheck',
    name: `${BASIC_HTTP_CHECK.job}__${BASIC_HTTP_CHECK.target}`,
  });
  expect(props.rankdir).toBe('TB');
  // Env-less checks link to every env twin of their service; the KG-owned picker isolates one.
  expect(props.showEnvFilter).toBe(true);
  // The section grows to the graph's natural height instead of zooming out to a fixed box.
  expect(props.autoHeight).toEqual({ min: 280, max: 560 });
  // Node interaction belongs to the exposed component's card; an SM deep link would race it.
  expect(props.onNodeClick).toBeUndefined();
});

it('links the section header to this check and its services in the KG entity graph', async () => {
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
