import React from 'react';
import { useAssistant } from '@grafana/assistant';
import { render as renderWithoutApp, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/render';

import { ReliabilitySuggestion } from './types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';

import { useReliabilityInboxSuggestions } from './data';
import { toReliabilityOpportunity } from './model';
import { ReliabilityInboxBanner } from './ReliabilityInboxBanner';
import { ReliabilityInboxPage } from './ReliabilityInboxPage';

jest.mock('./data', () => ({
  useReliabilityInboxSuggestions: jest.fn(),
}));

const HTTP_SUGGESTION: ReliabilitySuggestion = {
  id: 'http-suggestion',
  target: 'https://mcp.goagain.dev/',
  checkType: 'http',
  evidence: {
    reqPerS: 1.6081232492997197,
    p99Ms: 4,
    statusDistribution: {
      '200': 1.6058823529411763,
      '400': 0.002240896358543417,
    },
    families: ['http_server_request_duration_seconds_bucket'],
    activitySemantics: ['bytes'],
  },
  reachability: 'public',
  reachabilitySource: 'service_dns_hint',
  confidence: 'high',
  score: 1.4,
  dedupStatus: 'uncovered',
  authRequired: false,
  algorithms: ['score', 'llm_rank'],
  relevance: 75,
  angles: ['customer_facing'],
  rationale: 'Public endpoint with steady traffic serving likely critical MCP protocol functions.',
  prompt:
    'Create a Grafana Synthetic Monitoring http check for https://mcp.goagain.dev/. Suggested configuration: job "mcp.goagain.dev", frequency 1m0s, timeout 2s, expect HTTP status [200], fail if not SSL, probe IDs [7].',
};

const DNS_SUGGESTION: ReliabilitySuggestion = {
  id: 'dns-suggestion',
  target: 'host.docker.internal',
  checkType: 'dns',
  evidence: {
    reqPerS: 1.3,
    p99Ms: 4,
    statusDistribution: { '200': 1.3 },
    families: ['http_server_request_duration_seconds_bucket'],
    activitySemantics: ['bytes'],
  },
  reachability: 'nxdomain',
  reachabilitySource: 'service_dns_hint',
  confidence: 'high',
  score: 1.3,
  dedupStatus: 'uncovered',
  authRequired: false,
  needsConfiguration: true,
  configurationReason: 'private zone: configure the internal resolver and assign a private probe',
  algorithms: ['score'],
  angles: [],
  prompt: 'Create a Grafana Synthetic Monitoring dns check for host.docker.internal.',
};

const OPPORTUNITIES = [toReliabilityOpportunity(HTTP_SUGGESTION), toReliabilityOpportunity(DNS_SUGGESTION)];
const openAssistant = jest.fn();

function mockSuggestions() {
  (useReliabilityInboxSuggestions as jest.Mock).mockReturnValue({
    data: OPPORTUNITIES,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
}

function renderPage() {
  mockSuggestions();

  return render(<ReliabilityInboxPage />, {
    path: generateRoutePath(AppRoutes.ReliabilityInbox),
    route: getRoute(AppRoutes.ReliabilityInbox),
  });
}

describe('ReliabilityInboxPage', () => {
  beforeEach(() => {
    openAssistant.mockClear();
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: true,
      isLoading: false,
      openAssistant,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });
  });

  it('renders only the prioritized open queue without lifecycle tabs', async () => {
    renderPage();

    expect(await screen.findByText('Potential gap for mcp.goagain.dev')).toBeInTheDocument();
    expect(screen.getByText('Potential gap for host.docker.internal')).toBeInTheDocument();

    const opportunityHeadings = screen
      .getAllByRole('heading', { level: 2 })
      .filter((heading) => heading.textContent?.startsWith('Potential gap'));
    expect(opportunityHeadings[0]).toHaveTextContent('mcp.goagain.dev');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('2 open opportunities')).toBeInTheDocument();
  });

  it('expands the richer, in-context Figma evidence treatment', async () => {
    const { user } = renderPage();

    await user.click((await screen.findAllByText('View evidence'))[0]);

    expect(screen.getByText('Why this was recommended')).toBeInTheDocument();
    expect(screen.getByText('Signals measured over the last hour')).toBeInTheDocument();
    expect(screen.getByText('5.8k')).toBeInTheDocument();
    expect(screen.getByText(/0.14% HTTP error responses/)).toBeInTheDocument();
    expect(screen.getByText('Coverage analysis')).toBeInTheDocument();
    expect(screen.getByText('Confidence and limitations')).toBeInTheDocument();
  });

  it('opens and auto-sends the recommendation to Grafana Assistant', async () => {
    const { user } = renderPage();

    await user.click(await screen.findByText('Review check'));

    expect(openAssistant).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'grafana-synthetic-monitoring-app/reliability-inbox',
        autoSend: true,
        prompt: expect.stringContaining('review and set up'),
        context: [
          expect.objectContaining({
            type: 'structured',
            title: 'Reliability opportunity: mcp.goagain.dev',
            data: expect.objectContaining({
              task: 'review-and-setup-check',
              target: 'https://mcp.goagain.dev/',
            }),
          }),
        ],
      })
    );
  });

  it('asks Assistant to complete only the missing DNS setup', async () => {
    const { user } = renderPage();

    await user.click(await screen.findByText('Complete setup'));

    expect(openAssistant).toHaveBeenCalledWith(
      expect.objectContaining({
        autoSend: true,
        prompt: expect.stringContaining('The recommendation is incomplete'),
        context: [
          expect.objectContaining({
            data: expect.objectContaining({
              task: 'complete-check-setup',
              target: 'host.docker.internal',
              missingConfiguration: expect.stringContaining('internal resolver'),
            }),
          }),
        ],
      })
    );
  });

  it('unfolds the home banner into the inbox instead of navigating away', async () => {
    mockSuggestions();
    const user = userEvent.setup();
    renderWithoutApp(<ReliabilityInboxBanner />);

    expect(screen.queryByRole('heading', { name: 'Potential coverage gaps' })).not.toBeInTheDocument();

    await user.click(screen.getByText('Review opportunities'));

    expect(screen.getByRole('heading', { name: 'Potential coverage gaps' })).toBeInTheDocument();
    expect(screen.getByText('Potential gap for mcp.goagain.dev')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
