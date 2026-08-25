import React from 'react';
import { useAssistant } from '@grafana/assistant';
import { FieldType, toDataFrame } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { fireEvent, screen, within } from '@testing-library/react';
import { trackRecommendationReviewed, trackSetupWithAssistant } from 'features/tracking/reliabilityInboxEvents';
import { delay } from 'msw';
import { DB } from 'test/db';
import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { ReliabilitySuggestion } from './types';
import { CheckType, CheckTypeGroup, HttpMethod } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';

import { reliabilityInboxDismissalsKey, useRecommendationTelemetry } from './data';
import { ReliabilityInboxPage, ReliabilityInboxPageTitle } from './ReliabilityInboxPage';

jest.mock('./data', () => ({
  ...jest.requireActual('./data'),
  useRecommendationTelemetry: jest.fn(),
}));

jest.mock('features/tracking/reliabilityInboxEvents', () => ({
  trackRecommendationReviewed: jest.fn(),
  trackSetupWithAssistant: jest.fn(),
}));

const LOWER_PRIORITY_HTTP_SUGGESTION: ReliabilitySuggestion = DB.reliabilitySuggestion.build({
  ...HTTP_RELIABILITY_SUGGESTION,
  id: 'lower-priority-http-suggestion',
  target: 'https://secondary.goagain.dev/',
  relevance: 20,
  evidence: {
    ...HTTP_RELIABILITY_SUGGESTION.evidence,
    reqPerS: 0.5,
  },
});

const openAssistant = jest.fn();
const originalMatchMedia = window.matchMedia;
const GENERATED_AT = Date.UTC(2026, 7, 20, 13, 30);
const DISMISSALS_KEY = reliabilityInboxDismissalsKey('https://synthetic-monitoring-api-dev.grafana-dev.net', 15629);

function enableMotionAnimations() {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
}

function mockSuggestions(suggestions: ReliabilitySuggestion[] = [HTTP_RELIABILITY_SUGGESTION]) {
  server.use(
    apiRoute('reliabilityInboxSuggestions', {
      result: () => ({ json: { suggestions, warnings: [] } }),
    })
  );
}

function renderPage(suggestions: ReliabilitySuggestion[] = [HTTP_RELIABILITY_SUGGESTION]) {
  mockSuggestions(suggestions);

  return render(<ReliabilityInboxPage />, {
    path: generateRoutePath(AppRoutes.ReliabilityInbox),
    route: getRoute(AppRoutes.ReliabilityInbox),
  });
}

describe('ReliabilityInboxPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: true,
      isLoading: false,
      openAssistant,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });
    jest.mocked(useRecommendationTelemetry).mockReturnValue({
      data: undefined,
      isError: false,
    } as unknown as ReturnType<typeof useRecommendationTelemetry>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
  });

  it('groups feedback beside the title', async () => {
    render(<ReliabilityInboxPageTitle />);

    const title = await screen.findByRole('heading', { name: 'Check Suggestions' });
    const titleGroup = title.parentElement!;
    const experimentalBadge = within(titleGroup).getByText('Experimental');
    expect(within(experimentalBadge).getByTestId('ai-sparkle')).toBeVisible();
    expect(within(experimentalBadge).queryByTestId('rocket')).not.toBeInTheDocument();
    expect(within(titleGroup).getByRole('button', { name: 'I love this feature' })).toBeVisible();
    expect(within(titleGroup).getByRole('button', { name: "I don't like this feature" })).toBeVisible();
  });

  it('shows when suggestions were generated in the page actions', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(GENERATED_AT);
    renderPage();

    expect((await screen.findByText(/Generated/)).closest('time')).toHaveAttribute(
      'dateTime',
      new Date(GENERATED_AT).toISOString()
    );
    expect(await screen.findByRole('button', { name: 'Refresh suggestions' })).toBeEnabled();
  });

  it('requires confirmation before refreshing suggestions', async () => {
    const request = jest.fn(() => ({ json: { suggestions: [HTTP_RELIABILITY_SUGGESTION], warnings: [] } }));
    server.use(apiRoute('reliabilityInboxSuggestions', { result: request }));
    const { user } = render(<ReliabilityInboxPage />, {
      path: generateRoutePath(AppRoutes.ReliabilityInbox),
      route: getRoute(AppRoutes.ReliabilityInbox),
    });

    await screen.findByRole('region', { name: 'Suggested HTTP check' });

    await user.click(await screen.findByRole('button', { name: 'Refresh suggestions' }));

    const confirmation = await screen.findByTestId('toggletip-content');
    expect(within(confirmation).getByRole('heading', { name: 'Refresh suggestions?' })).toBeVisible();
    expect(
      within(confirmation).getByText(/reruns the traffic analysis and replaces the current suggestions/i)
    ).toBeVisible();
    expect(request).toHaveBeenCalledTimes(1);

    await user.click(within(confirmation).getByRole('button', { name: 'Refresh suggestions' }));

    expect(request).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId('toggletip-content')).not.toBeInTheDocument();
  });

  it('disables refresh while suggestions are being generated', async () => {
    const { user } = renderPage();
    await screen.findByRole('region', { name: 'Suggested HTTP check' });
    server.use(
      apiRoute('reliabilityInboxSuggestions', {
        result: async () => {
          await delay(10_000);
          return { json: { suggestions: [HTTP_RELIABILITY_SUGGESTION], warnings: [] } };
        },
      })
    );

    await user.click(screen.getByRole('button', { name: 'Refresh suggestions' }));
    await user.click(
      within(await screen.findByTestId('toggletip-content')).getByRole('button', { name: 'Refresh suggestions' })
    );

    expect(await screen.findByRole('button', { name: 'Refresh suggestions' })).toBeDisabled();
    expect(screen.getByText('Refreshing suggestions…')).toBeVisible();
  });

  it.each([
    { heading: '1 Recommendation', suggestions: [HTTP_RELIABILITY_SUGGESTION] },
    {
      heading: '2 Recommendations',
      suggestions: [HTTP_RELIABILITY_SUGGESTION, LOWER_PRIORITY_HTTP_SUGGESTION],
    },
  ])('shows the recommendation total as "$heading"', async ({ heading, suggestions }) => {
    renderPage(suggestions);

    const queue = await screen.findByLabelText('Recommendations');
    const disclosure = within(queue).getByRole('button', {
      name: `Recommendations, ${suggestions.length} active, 0 dismissed`,
    });
    expect(within(disclosure).getByText(heading)).toBeVisible();
  });

  it('selects one creation encouragement when the suggested check is displayed', async () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.4);
    const { user } = renderPage();

    const suggestedCheck = await screen.findByRole('region', { name: 'Suggested HTTP check' });
    expect(within(suggestedCheck).getByText('Start monitoring this endpoint in under a minute.')).toBeVisible();

    random.mockReturnValue(0.9);
    await user.click(within(suggestedCheck).getByRole('button', { name: 'Why this check?' }));

    expect(within(suggestedCheck).getByText('Start monitoring this endpoint in under a minute.')).toBeVisible();
    expect(within(suggestedCheck).queryByText('Catch outages before your users do.')).not.toBeInTheDocument();
  });

  it('keeps the recommendation hook visible and reveals its evidence inside the suggested check', async () => {
    jest.mocked(useRecommendationTelemetry).mockReturnValue({
      data: [
        toDataFrame({
          refId: 'A',
          fields: [
            { name: 'Time', type: FieldType.time, values: [1784800800000, 1784802600000, 1784804400000] },
            { name: 'Requests per second', type: FieldType.number, values: [1.4, 1.7, 1.6] },
          ],
        }),
        toDataFrame({
          refId: 'B',
          fields: [
            { name: 'Time', type: FieldType.time, values: [1784800800000, 1784802600000, 1784804400000] },
            { name: '5xx ratio', type: FieldType.number, values: [0.001, 0.002, 0.0014] },
          ],
        }),
        toDataFrame({
          refId: 'C',
          fields: [
            { name: 'Time', type: FieldType.time, values: [1784800800000, 1784802600000, 1784804400000] },
            { name: 'P99 milliseconds', type: FieldType.number, values: [3, 5, 4] },
          ],
        }),
      ],
      isError: false,
    } as unknown as ReturnType<typeof useRecommendationTelemetry>);

    const { user } = renderPage();

    const suggestedCheck = await screen.findByRole('region', { name: 'Suggested HTTP check' });
    expect(within(suggestedCheck).getByText('Suggested check')).toBeInTheDocument();
    expect(within(suggestedCheck).getByText('HTTP')).toBeInTheDocument();
    expect(within(suggestedCheck).queryByText('Create an HTTP check')).not.toBeInTheDocument();
    expect(suggestedCheck).toHaveTextContent('Job namemcp.goagain.devTarget URLGEThttps://mcp.goagain.dev/');

    const suggestedCheckHeader = suggestedCheck.querySelector('header');
    expect(suggestedCheckHeader).not.toBeNull();
    expect(within(suggestedCheckHeader!).getByText('5.8k requests').closest('p')).toHaveTextContent(
      '5.8k requests reached this endpoint during a one hour period, but no matching uptime check was found.'
    );
    expect(screen.queryByRole('region', { name: 'Why this recommendation' })).not.toBeInTheDocument();

    const evidenceDisclosure = within(suggestedCheckHeader!).getByRole('button', { name: 'Why this check?' });
    expect(evidenceDisclosure).toHaveAttribute('aria-expanded', 'false');
    expect(suggestedCheck.querySelector('#reliability-inbox-recommendation-evidence')).not.toBeInTheDocument();

    await user.click(evidenceDisclosure);

    const evidence = suggestedCheck.querySelector<HTMLElement>('#reliability-inbox-recommendation-evidence')!;
    expect(evidenceDisclosure).toHaveAttribute('aria-expanded', 'true');
    expect(within(evidence).getByText('Request activity')).toBeVisible();
    expect(within(evidence).getByText('5xx responses')).toBeVisible();
    expect(within(evidence).getByText('p99 response time')).toBeVisible();
    expect(await within(evidence).findByRole('img', { name: 'Request activity trend' })).toBeVisible();
    expect(within(evidence).getByRole('img', { name: '5xx responses trend' })).toBeVisible();
    expect(within(evidence).getByRole('img', { name: 'p99 response time trend' })).toBeVisible();
    expect(within(evidence).getByRole('link', { name: 'Open in Explore' })).toHaveAttribute(
      'href',
      expect.stringContaining('/explore?')
    );

    expect(
      within(evidence).getByText(
        'We looked for an existing HTTP check with the same hostname and URL path among the checks available to us. Aliases, redirects, upstream checks, and inaccessible monitoring may not be represented.'
      )
    ).toBeVisible();
    expect(
      within(evidence).queryByText('Exact endpoint-and-path matching across accessible checks')
    ).not.toBeInTheDocument();
    expect(within(evidence).queryByRole('button', { name: 'How we checked' })).not.toBeInTheDocument();
    expect(trackRecommendationReviewed).toHaveBeenCalledWith({ opportunityId: 'http-suggestion' });
  });

  it('reserves the telemetry plots and shows their loading indicators while the query is in flight', async () => {
    jest.mocked(useRecommendationTelemetry).mockReturnValue({
      data: undefined,
      isError: false,
      isFetching: true,
      isLoading: true,
    } as unknown as ReturnType<typeof useRecommendationTelemetry>);

    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Why this check?' }));

    const evidence = document.getElementById('reliability-inbox-recommendation-evidence')!;
    expect(within(evidence).getByRole('status', { name: 'Loading request activity trend' })).toBeVisible();
    expect(within(evidence).getByRole('status', { name: 'Loading 5xx responses trend' })).toBeVisible();
    expect(within(evidence).getByRole('status', { name: 'Loading p99 response time trend' })).toBeVisible();
  });

  it('updates the detail pane when a different recommendation is selected', async () => {
    enableMotionAnimations();
    const { user } = renderPage([HTTP_RELIABILITY_SUGGESTION, LOWER_PRIORITY_HTTP_SUGGESTION]);

    const currentSuggestion = await screen.findByRole('region', { name: 'Suggested HTTP check' });

    const queue = screen.getByLabelText('Recommendations');
    const firstRecommendation = within(queue).getByRole('button', { name: /mcp\.goagain\.dev/i });
    const secondRecommendation = within(queue).getByRole('button', { name: /secondary\.goagain\.dev/i });
    await user.click(secondRecommendation);

    expect(within(currentSuggestion).getByText('https://mcp.goagain.dev/')).toBeInTheDocument();
    fireEvent.animationEnd(currentSuggestion.parentElement!);

    expect(firstRecommendation).toHaveAttribute('aria-pressed', 'false');
    expect(secondRecommendation).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(screen.getByRole('region', { name: 'Suggested HTTP check' })).getByText('https://secondary.goagain.dev/')
    ).toBeInTheDocument();
    expect(trackRecommendationReviewed).toHaveBeenCalledWith({ opportunityId: 'lower-priority-http-suggestion' });
  });

  it('keeps the responsive disclosure inside recommendations and collapses it after selection', async () => {
    const { user } = renderPage([HTTP_RELIABILITY_SUGGESTION, LOWER_PRIORITY_HTTP_SUGGESTION]);

    const queue = await screen.findByLabelText('Recommendations');
    const disclosure = within(queue).getByRole('button', {
      name: 'Recommendations, 2 active, 0 dismissed',
    });
    expect(within(disclosure).getByText('2 Recommendations')).toBeVisible();
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(disclosure).toHaveAttribute('aria-controls', 'reliability-inbox-recommendation-queue-content');

    await user.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');

    await user.click(within(queue).getByRole('button', { name: /secondary\.goagain\.dev/i }));

    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(screen.getByRole('region', { name: 'Suggested HTTP check' })).getByText('https://secondary.goagain.dev/')
    ).toBeVisible();
  });

  it('does not render missing aggregate evidence as zero', async () => {
    const { user } = renderPage([
      {
        ...HTTP_RELIABILITY_SUGGESTION,
        evidence: {
          statusDistribution: {},
          families: HTTP_RELIABILITY_SUGGESTION.evidence.families,
        },
      },
    ]);

    await user.click(await screen.findByRole('button', { name: 'Why this check?' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'No aggregate traffic values were returned for this suggestion.'
    );
    expect(screen.queryByText('0 req/s')).not.toBeInTheDocument();
    expect(screen.queryByText('0 ms')).not.toBeInTheDocument();
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open in Explore' })).not.toBeInTheDocument();
  });

  it('explains the telemetry analysis while suggestions are generated', async () => {
    server.use(
      apiRoute('reliabilityInboxSuggestions', {
        result: async () => {
          await delay(10_000);
          return { json: { suggestions: [HTTP_RELIABILITY_SUGGESTION], warnings: [] } };
        },
      })
    );

    render(<ReliabilityInboxPage />, {
      path: generateRoutePath(AppRoutes.ReliabilityInbox),
      route: getRoute(AppRoutes.ReliabilityInbox),
    });

    const loadingState = await screen.findByRole('status');
    expect(within(loadingState).getByRole('heading', { name: 'Finding gaps in your monitoring' })).toBeInTheDocument();
    expect(within(loadingState).getByText(/analyzing recent Prometheus telemetry/i)).toBeInTheDocument();
    expect(
      within(loadingState).getByText('Discovering services and endpoints from recent traffic')
    ).toBeInTheDocument();
    expect(
      within(loadingState).getByText('Reviewing request volume, errors, latency, and outage history')
    ).toBeInTheDocument();
    expect(within(loadingState).getByText('Ranking uncovered monitoring opportunities with AI')).toBeInTheDocument();
    expect(within(loadingState).getByText('This may take a minute.')).toBeInTheDocument();
    expect(screen.queryByText('Why this recommendation')).not.toBeInTheDocument();
  });

  it('explains when the user cannot access suggestions', async () => {
    server.use(
      apiRoute('reliabilityInboxSuggestions', {
        result: () => ({ status: 403, json: { message: 'Access denied' } }),
      })
    );

    render(<ReliabilityInboxPage />, {
      path: generateRoutePath(AppRoutes.ReliabilityInbox),
      route: getRoute(AppRoutes.ReliabilityInbox),
    });

    expect(await screen.findByText('You do not have permission to load Reliability Inbox suggestions.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  it('explains when the suggestions service is unavailable', async () => {
    server.use(apiRoute('reliabilityInboxSuggestions', { result: () => ({ status: 500 }) }));

    render(<ReliabilityInboxPage />, {
      path: generateRoutePath(AppRoutes.ReliabilityInbox),
      route: getRoute(AppRoutes.ReliabilityInbox),
    });

    expect(await screen.findByText('The Reliability Inbox service is unavailable. Try again later.')).toBeVisible();
  });

  it('keeps current suggestions usable while looking for new opportunities', async () => {
    const { user } = renderPage();
    await screen.findByRole('region', { name: 'Suggested HTTP check' });
    server.use(
      apiRoute('reliabilityInboxSuggestions', {
        result: async () => {
          await delay(10_000);
          return { json: { suggestions: [HTTP_RELIABILITY_SUGGESTION], warnings: [] } };
        },
      })
    );

    await user.click(screen.getByRole('button', { name: 'Refresh suggestions' }));
    await user.click(
      within(await screen.findByTestId('toggletip-content')).getByRole('button', { name: 'Refresh suggestions' })
    );

    expect(await screen.findByText('Showing current suggestions · Looking for new opportunities…')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Suggested HTTP check' })).toBeInTheDocument();
  });

  it('keeps current suggestions usable when the refresh fails', async () => {
    const { user } = renderPage();
    await screen.findByRole('region', { name: 'Suggested HTTP check' });
    server.use(apiRoute('reliabilityInboxSuggestions', { result: () => ({ status: 500 }) }));

    await user.click(screen.getByRole('button', { name: 'Refresh suggestions' }));
    await user.click(
      within(await screen.findByTestId('toggletip-content')).getByRole('button', { name: 'Refresh suggestions' })
    );

    expect(await screen.findByText('Suggestions could not be refreshed')).toBeInTheDocument();
    expect(
      screen.getByText('Showing current suggestions. Try again later for newer opportunities.')
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Suggested HTTP check' })).toBeInTheDocument();
  });

  it('dismisses suggestions from the card footer, advances, and keeps them available to restore', async () => {
    enableMotionAnimations();
    const second = DB.reliabilitySuggestion.build({
      ...HTTP_RELIABILITY_SUGGESTION,
      id: 'api-suggestion',
      target: 'https://api.example.com/',
      score: 1.3,
      relevance: 50,
      prompt: HTTP_RELIABILITY_SUGGESTION.prompt.replaceAll('mcp.goagain.dev', 'api.example.com'),
    });

    const { user } = renderPage([HTTP_RELIABILITY_SUGGESTION, second]);

    const dismissButton = await screen.findByRole('button', { name: 'Dismiss suggestion' });
    const currentSuggestion = screen.getByRole('region', { name: 'Suggested HTTP check' });
    expect(dismissButton).toHaveTextContent('Dismiss suggestion');
    await user.click(dismissButton);

    expect(within(currentSuggestion).getByText('https://mcp.goagain.dev/')).toBeInTheDocument();
    fireEvent.animationEnd(currentSuggestion.parentElement!);

    expect(JSON.parse(window.localStorage.getItem(DISMISSALS_KEY)!)).toEqual(['http-suggestion']);
    expect(
      within(screen.getByRole('region', { name: 'Suggested HTTP check' })).getByText('https://api.example.com/')
    ).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Suggestion dismissed in this browser' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Dismissed 1' }));
    fireEvent.animationEnd(screen.getByRole('region', { name: 'Suggested HTTP check' }).parentElement!);
    const dismissedSuggestion = screen.getByRole('region', { name: 'Suggested HTTP check' });
    expect(within(dismissedSuggestion).getByText('https://mcp.goagain.dev/')).toBeInTheDocument();
    await user.click(within(dismissedSuggestion).getByRole('button', { name: 'Restore suggestion' }));
    fireEvent.animationEnd(dismissedSuggestion.parentElement!);

    expect(JSON.parse(window.localStorage.getItem(DISMISSALS_KEY)!)).toEqual([]);
    expect(screen.getByRole('tab', { name: 'Dismissed 0' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Active 2' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('No dismissed suggestions')).toBeVisible();
  });

  it('stays on the dismissed tab after restoring its final suggestion', async () => {
    const dismissedSuggestion = DB.reliabilitySuggestion.build({
      ...LOWER_PRIORITY_HTTP_SUGGESTION,
      id: 'dismissed-http-suggestion',
      target: 'https://dismissed.goagain.dev/',
    });
    window.localStorage.setItem(DISMISSALS_KEY, JSON.stringify([dismissedSuggestion.id]));

    const { user } = renderPage([HTTP_RELIABILITY_SUGGESTION, dismissedSuggestion]);

    expect(await screen.findByRole('tablist')).toBeInTheDocument();
    const dismissedFilter = await screen.findByRole('tab', { name: 'Dismissed 1' });
    expect(dismissedFilter).toHaveAttribute('aria-selected', 'false');
    dismissedFilter.focus();
    await user.keyboard('{Enter}');

    const suggestedCheck = screen.getByRole('region', { name: 'Suggested HTTP check' });
    expect(within(suggestedCheck).getByText('https://dismissed.goagain.dev/')).toBeVisible();
    expect(within(suggestedCheck).getByRole('button', { name: 'Restore suggestion' })).toBeVisible();
    expect(within(suggestedCheck).queryByRole('button', { name: 'Dismiss suggestion' })).not.toBeInTheDocument();
    expect(within(suggestedCheck).queryByRole('button', { name: 'Create manually' })).not.toBeInTheDocument();

    await user.click(within(suggestedCheck).getByRole('button', { name: 'Restore suggestion' }));

    expect(JSON.parse(window.localStorage.getItem(DISMISSALS_KEY)!)).toEqual([]);
    expect(await screen.findByRole('tab', { name: 'Dismissed 0' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Active 2' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('No dismissed suggestions')).toBeVisible();

    const recommendationQueue = screen.getByLabelText('Recommendations');
    expect(within(recommendationQueue).getByText('Nothing dismissed yet.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'View active suggestions' }));

    expect(screen.getByRole('tab', { name: 'Active 2' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('region', { name: 'Suggested HTTP check' })).toBeVisible();
  });

  it('links to dismissed suggestions when no active recommendations remain', async () => {
    window.localStorage.setItem(DISMISSALS_KEY, JSON.stringify([HTTP_RELIABILITY_SUGGESTION.id]));

    const { user } = renderPage();

    expect(await screen.findByText('No active recommendations')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Recommendations')).getByText('Nothing active yet.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'View dismissed suggestions' }));

    expect(screen.getByRole('tab', { name: 'Dismissed 1' })).toHaveAttribute('aria-selected', 'true');
    const suggestedCheck = screen.getByRole('region', { name: 'Suggested HTTP check' });
    expect(within(suggestedCheck).getByText('https://mcp.goagain.dev/')).toBeVisible();
    expect(within(suggestedCheck).getByRole('button', { name: 'Restore suggestion' })).toBeVisible();
  });

  it('shows the complete proposed check configuration without hiding details', async () => {
    renderPage();

    const suggestedCheck = await screen.findByRole('region', { name: 'Suggested HTTP check' });
    expect(within(suggestedCheck).getByText('mcp.goagain.dev')).toBeVisible();
    expect(within(suggestedCheck).getByText('GET')).toBeVisible();
    expect(within(suggestedCheck).getByText('https://mcp.goagain.dev/')).toBeVisible();
    expect(within(suggestedCheck).getByRole('button', { name: 'Copy target URL' })).toBeVisible();
    expect(within(suggestedCheck).queryByText('View configuration details')).not.toBeInTheDocument();

    const uptimeDefinition = within(suggestedCheck).getByRole('region', { name: 'Uptime definition' });
    expect(within(uptimeDefinition).getByText('2 seconds')).toBeVisible();
    expect(within(uptimeDefinition).getByText('HTTP 200')).toBeVisible();
    expect(within(uptimeDefinition).getByText('Require HTTPS')).toBeVisible();

    const configuration = within(suggestedCheck).getByRole('region', { name: 'Configuration' });
    expect(within(configuration).getByText('Every 1 minute')).toBeVisible();
    expect(within(configuration).getByText('Run from the configured public probe with ID 7.')).toBeVisible();
    expect(within(configuration).getByText('Labels')).toBeVisible();
    expect(within(configuration).getByText('Added during creation')).toBeVisible();
    expect(within(configuration).getByText('Alerts')).toBeVisible();
    expect(within(configuration).getByText('Configured during creation')).toBeVisible();
    expect(within(suggestedCheck).queryByRole('region', { name: 'Execution' })).not.toBeInTheDocument();

    expect(within(suggestedCheck).getByRole('button', { name: 'Create manually' })).toBeVisible();
    expect(within(suggestedCheck).getByRole('button', { name: 'Dismiss suggestion' })).toBeVisible();
    expect(within(suggestedCheck).getByRole('button', { name: 'Create with Grafana Assistant' })).toBeInTheDocument();
    expect(within(suggestedCheck).getByRole('button', { name: 'Create with Grafana Assistant' })).toHaveAttribute(
      'aria-describedby',
      'reliability-inbox-assistant-action-help'
    );
    expect(
      within(suggestedCheck).getByText(
        'You can review and adjust every setting in the check editor before anything is created.'
      )
    ).toBeInTheDocument();
    expect(openAssistant).not.toHaveBeenCalled();
  });

  it('opens the HTTP form with the proposal prefilled for manual creation', async () => {
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Create manually' }));

    expect(locationService.getLocation()).toMatchObject({
      pathname: `${generateRoutePath(AppRoutes.NewCheck)}/${CheckTypeGroup.ApiTest}`,
      search: `?checkType=${CheckType.Http}`,
      state: {
        prefilledCheck: expect.objectContaining({
          job: 'mcp.goagain.dev',
          target: 'https://mcp.goagain.dev/',
          frequency: 60_000,
          timeout: 2_000,
          probes: [7],
          labels: [],
          settings: {
            http: expect.objectContaining({
              method: HttpMethod.Get,
              validStatusCodes: [200],
              failIfNotSSL: true,
            }),
          },
        }),
      },
    });
    expect(openAssistant).not.toHaveBeenCalled();
  });

  it('hands structured evidence and draft to Assistant as bounded setup guidance', async () => {
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Create with Grafana Assistant' }));

    expect(trackSetupWithAssistant).toHaveBeenCalledWith({ opportunityId: 'http-suggestion' });
    expect(openAssistant).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'grafana-synthetic-monitoring-app/reliability-inbox',
        autoSend: true,
        prompt: expect.stringMatching(/Do not create or save the check until I explicitly confirm/i),
        context: [
          expect.objectContaining({
            type: 'structured',
            title: 'Reliability Inbox setup: mcp.goagain.dev',
            data: {
              name: 'Reliability Inbox guided setup',
              suggestion: {
                id: HTTP_RELIABILITY_SUGGESTION.id,
                target: HTTP_RELIABILITY_SUGGESTION.target,
                checkType: HTTP_RELIABILITY_SUGGESTION.checkType,
                reachability: HTTP_RELIABILITY_SUGGESTION.reachability,
                confidence: HTTP_RELIABILITY_SUGGESTION.confidence,
                rationale: HTTP_RELIABILITY_SUGGESTION.rationale,
                evidence: {
                  reqPerS: HTTP_RELIABILITY_SUGGESTION.evidence.reqPerS,
                  errorRatio: HTTP_RELIABILITY_SUGGESTION.evidence.errorRatio,
                  p99Ms: HTTP_RELIABILITY_SUGGESTION.evidence.p99Ms,
                },
              },
              suggestedDraft: expect.objectContaining({
                target: 'https://mcp.goagain.dev/',
                checkType: 'http',
                frequencyMs: 60_000,
                timeoutMs: 2000,
                validStatusCodes: [200],
                probeIds: [7],
              }),
            },
          }),
        ],
      })
    );
    expect(openAssistant.mock.calls[0][0].context[0].bypassLimits).toBeUndefined();
  });

  it('defers probe location selection to the review flow', async () => {
    renderPage([
      {
        ...HTTP_RELIABILITY_SUGGESTION,
        prompt:
          'Create a Grafana Synthetic Monitoring http check for https://mcp.goagain.dev/. Suggested configuration: job "mcp.goagain.dev", frequency 1m0s, timeout 2s, expect HTTP status [200], fail if not SSL, probe IDs [].',
      },
    ]);

    const suggestedCheck = await screen.findByRole('region', { name: 'Suggested HTTP check' });
    expect(within(suggestedCheck).queryByText('Probe selection required')).not.toBeInTheDocument();
    expect(within(suggestedCheck).getByText('Probe locations will be selected during review.')).toBeVisible();
  });
});
