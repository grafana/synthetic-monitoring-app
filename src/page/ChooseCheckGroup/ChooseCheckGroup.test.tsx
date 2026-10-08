import React from 'react';
import { NavModelItem } from '@grafana/data';
import { config } from '@grafana/runtime';
import { screen, waitFor, within } from '@testing-library/react';
import { CONFIG_TEST_ID } from 'test/dataTestIds';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsHGFreeUserOverLimit, runTestAsViewer } from 'test/utils';

import { CheckType, CheckTypeGroup, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';

import { CHOOSE_CHECK_TAB_PARAM, ChooseCheckGroup, ChooseCheckTab } from './ChooseCheckGroup';

jest.mock('features/tracking/checkCreationEvents', () => ({
  ...jest.requireActual('features/tracking/checkCreationEvents'),
  trackAddCheckTypeButtonClicked: jest.fn(),
  trackAddCheckTypeGroupButtonClicked: jest.fn(),
}));

import {
  trackAddCheckTypeButtonClicked,
  trackAddCheckTypeGroupButtonClicked,
} from 'features/tracking/checkCreationEvents';

const API_ENDPOINT_TYPES = ['HTTP', 'Ping', 'DNS', 'TCP', 'Traceroute'];
const JOURNEY_TYPES = ['Multi Step', 'Scripted', 'Browser'];
const AGENT_TOOLS = ['Claude Code', 'Cursor, Codex & other agents'];
const SCRIPTED_LIMIT_REASON = 'Scripted and Multi Step check limit reached';

interface RenderOptions {
  checkLimit?: number;
  scriptedLimit?: number;
  /** Leaves the limits request unanswered, to render the page as it looks while limits load. */
  limitsPending?: boolean;
  /** A raw value, so tests can also request tabs that do not exist. */
  tab?: string;
}

async function renderChooseCheckGroup({
  checkLimit = 10,
  scriptedLimit = 10,
  limitsPending = false,
  tab,
}: RenderOptions = {}) {
  server.use(
    apiRoute('getTenantLimits', {
      result: limitsPending
        ? () => new Promise<never>(() => {})
        : () => ({
            json: {
              MaxChecks: checkLimit,
              MaxScriptedChecks: scriptedLimit,
              MaxMetricLabels: 16,
              MaxLogLabels: 13,
              maxAllowedMetricLabels: 10,
              maxAllowedLogLabels: 5,
            },
          }),
    })
  );
  const path = tab ? `${AppRoutes.ChooseCheckGroup}?${CHOOSE_CHECK_TAB_PARAM}=${tab}` : AppRoutes.ChooseCheckGroup;
  const res = render(<ChooseCheckGroup />, { path });
  await screen.findByText('Create a new check');

  return res;
}

function getSection(name: string) {
  return screen.getByRole('region', { name });
}

function getActiveTab() {
  return screen.getByTestId(CONFIG_TEST_ID.layout.activeTab);
}

/** The tile whose title is `name`, whether it is currently a link, a button or disabled. */
function getTile(name: string) {
  const tile = screen.getByText(name).closest<HTMLElement>('[role="listitem"]');

  if (!tile) {
    throw new Error(`No tile titled "${name}"`);
  }

  return tile;
}

// Disabled tiles keep their content but stop being a link or button, so nothing can open them.
function expectTileDisabled(name: string) {
  const tile = getTile(name);

  expect(within(tile).queryByRole('link')).not.toBeInTheDocument();
  expect(within(tile).queryByRole('button')).not.toBeInTheDocument();
}

// Tiles are plain anchors that Grafana routes in the app; jsdom would otherwise try a full navigation.
function preventLinkNavigation(event: MouseEvent) {
  if (event.target instanceof Element && event.target.closest('a[href]')) {
    event.preventDefault();
  }
}

beforeAll(() => document.addEventListener('click', preventLinkNavigation));
afterAll(() => document.removeEventListener('click', preventLinkNavigation));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('tabs', () => {
  it('opens on the check type tab', async () => {
    await renderChooseCheckGroup();

    expect(getActiveTab()).toHaveTextContent('By check type');
    expect(getSection('API endpoint')).toBeInTheDocument();
    expect(screen.queryByText('Detect broken links')).not.toBeInTheDocument();
    expect(screen.queryByText(AGENT_TOOLS[0])).not.toBeInTheDocument();
  });

  it('falls back to the check type tab when the requested tab does not exist', async () => {
    await renderChooseCheckGroup({ tab: 'not-a-tab' });

    expect(getActiveTab()).toHaveTextContent('By check type');
    expect(getSection('API endpoint')).toBeInTheDocument();
  });

  it('shows only templates on the template tab', async () => {
    await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });

    expect(getActiveTab()).toHaveTextContent('From a template');
    expect(await screen.findByRole('button', { name: 'Detect broken links' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'HTTP' })).not.toBeInTheDocument();
  });

  it('shows only the coding agent setup on the agent tab', async () => {
    await renderChooseCheckGroup({ tab: ChooseCheckTab.Agent });

    expect(getActiveTab()).toHaveTextContent('With a coding agent');
    for (const name of AGENT_TOOLS) {
      expect(await screen.findByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: 'HTTP' })).not.toBeInTheDocument();
  });

  it('links every tab to the current page, with only non-default tabs adding a query', async () => {
    const runtime: { PluginPage: (props: { pageNav: NavModelItem }) => unknown } = jest.requireMock('@grafana/runtime');
    const pluginPage = jest.spyOn(runtime, 'PluginPage');
    await renderChooseCheckGroup({ tab: ChooseCheckTab.Agent });

    const pageNav = pluginPage.mock.lastCall?.[0].pageNav;
    expect(pageNav?.children?.map(({ text, url, active }) => ({ text, url, active }))).toEqual([
      { text: 'By check type', url: expect.stringMatching(/\/checks\/choose-type$/), active: false },
      { text: 'From a template', url: expect.stringMatching(/\/checks\/choose-type\?tab=template$/), active: false },
      { text: 'With a coding agent', url: expect.stringMatching(/\/checks\/choose-type\?tab=agent$/), active: true },
    ]);
    expect(pageNav?.children?.every(({ icon }) => Boolean(icon))).toBe(true);
    pluginPage.mockRestore();
  });
});

describe('check type tab', () => {
  it('groups every check type into an API endpoint and a journeys section', async () => {
    await renderChooseCheckGroup();

    const apiSection = getSection('API endpoint');
    expect(within(apiSection).getAllByRole('listitem')).toHaveLength(API_ENDPOINT_TYPES.length);
    API_ENDPOINT_TYPES.forEach((name) => {
      expect(within(apiSection).getByRole('link', { name })).toBeInTheDocument();
    });

    const journeySection = getSection('Journeys and scripts');
    expect(within(journeySection).getAllByRole('listitem')).toHaveLength(JOURNEY_TYPES.length);
    JOURNEY_TYPES.forEach((name) => {
      expect(within(journeySection).getByRole('link', { name })).toBeInTheDocument();
    });
  });

  it('keeps check types available while limits are still loading', async () => {
    await renderChooseCheckGroup({ limitsPending: true });

    [...API_ENDPOINT_TYPES, ...JOURNEY_TYPES].forEach((name) => {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    });
  });

  it('describes each check type on its tile', async () => {
    await renderChooseCheckGroup();

    expect(
      within(getTile('HTTP')).getByText('Request a URL and check its status, response time and SSL certificate.')
    ).toBeInTheDocument();
    expect(
      within(getTile('Browser')).getByText('Script a real browser to load pages and interact like a user.')
    ).toBeInTheDocument();
  });

  it('links API endpoint tiles to the API endpoint form with their request type selected', async () => {
    await renderChooseCheckGroup();

    expect(screen.getByRole('link', { name: 'HTTP' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/${CheckTypeGroup.ApiTest}?checkType=${CheckType.Http}`)
    );
    expect(screen.getByRole('link', { name: 'Traceroute' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/${CheckTypeGroup.ApiTest}?checkType=${CheckType.Traceroute}`)
    );
  });

  it('links journey and script tiles to their own forms', async () => {
    await renderChooseCheckGroup();

    expect(screen.getByRole('link', { name: 'Multi Step' })).toHaveAttribute(
      'href',
      expect.stringMatching(new RegExp(`/${CheckTypeGroup.MultiStep}$`))
    );
    expect(screen.getByRole('link', { name: 'Scripted' })).toHaveAttribute(
      'href',
      expect.stringMatching(new RegExp(`/${CheckTypeGroup.Scripted}$`))
    );
    expect(screen.getByRole('link', { name: 'Browser' })).toHaveAttribute(
      'href',
      expect.stringMatching(new RegExp(`/${CheckTypeGroup.Browser}$`))
    );
  });

  it('tracks the request type when an API endpoint tile is selected', async () => {
    const { user } = await renderChooseCheckGroup();

    await user.click(screen.getByRole('link', { name: 'DNS' }));

    expect(trackAddCheckTypeButtonClicked).toHaveBeenCalledWith({
      checkTypeGroup: CheckTypeGroup.ApiTest,
      protocol: CheckType.Dns,
    });
    expect(trackAddCheckTypeGroupButtonClicked).not.toHaveBeenCalled();
  });

  it('tracks the group when a journey or script tile is selected', async () => {
    const { user } = await renderChooseCheckGroup();

    await user.click(screen.getByRole('link', { name: 'Browser' }));

    expect(trackAddCheckTypeGroupButtonClicked).toHaveBeenCalledWith({ checkTypeGroup: CheckTypeGroup.Browser });
    expect(trackAddCheckTypeButtonClicked).not.toHaveBeenCalled();
  });

  it(`doesn't show gRPC option by default`, async () => {
    await renderChooseCheckGroup();
    expect(screen.queryByRole('link', { name: 'gRPC' })).not.toBeInTheDocument();
  });

  it('shows gRPC option when feature is enabled', async () => {
    jest.replaceProperty(config, 'featureToggles', {
      // @ts-expect-error
      [FeatureName.GRPCChecks]: true,
    });

    await renderChooseCheckGroup();
    expect(within(getSection('API endpoint')).getByRole('link', { name: 'gRPC' })).toBeInTheDocument();
  });

  it('shows error alert when check limit is reached', async () => {
    await renderChooseCheckGroup({ checkLimit: 1 });
    const limitError = await screen.findByText(/You have reached your check limit of /);
    expect(limitError).toBeInTheDocument();
  });

  it(`disables every check type when user is HG Free user over the execution limit`, async () => {
    runTestAsHGFreeUserOverLimit();

    await renderChooseCheckGroup();
    const alert = await screen.findByText(/You have reached your monthly execution limit of/);
    expect(alert).toBeInTheDocument();

    await waitFor(() => [...API_ENDPOINT_TYPES, ...JOURNEY_TYPES].forEach(expectTileDisabled));
  });

  it('disables only scripted and multi-step tiles, with a reason, when the scripted limit is reached', async () => {
    await renderChooseCheckGroup({ scriptedLimit: 0 });

    await waitFor(() => expect(within(getTile('Scripted')).getByText(SCRIPTED_LIMIT_REASON)).toBeInTheDocument());
    expectTileDisabled('Scripted');
    expectTileDisabled('Multi Step');
    expect(within(getTile('Multi Step')).getByText(SCRIPTED_LIMIT_REASON)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'HTTP' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browser' })).toBeInTheDocument();
  });
});

describe('template tab', () => {
  it('offers the templates and the WebSocket example', async () => {
    await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });

    await screen.findByRole('button', { name: 'Detect broken links' });
    expect(
      within(getTile('Detect broken links')).getByText('Check a page for links that no longer work.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Test a WebSocket API' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/${CheckTypeGroup.Scripted}?example=websocket`)
    );
  });

  it('tracks the WebSocket example as a scripted protocol selection', async () => {
    const { user } = await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });

    await user.click(screen.getByRole('link', { name: 'Test a WebSocket API' }));

    expect(trackAddCheckTypeButtonClicked).toHaveBeenCalledWith({
      checkTypeGroup: CheckTypeGroup.Scripted,
      protocol: 'WebSockets',
    });
  });

  it('opens the template drawer and tracks selection without a feature flag', async () => {
    const reportInteraction = jest.spyOn(jest.requireMock('@grafana/runtime'), 'reportInteraction');
    const { user } = await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });
    // Templates create checks directly, so they stay disabled until limits are known.
    await user.click(await screen.findByRole('button', { name: 'Detect broken links' }));
    expect(reportInteraction).toHaveBeenCalledWith(
      'synthetic-monitoring_check_templates_template_selected',
      expect.objectContaining({ check_template_id: 'broken_links' })
    );
    expect(await screen.findByRole('textbox', { name: /^Page URL/ })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Check name' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('textbox', { name: /^Page URL/ })).not.toBeInTheDocument();
  });

  it('disables templates when the check limit is reached', async () => {
    await renderChooseCheckGroup({ checkLimit: 1, tab: ChooseCheckTab.Template });
    await screen.findByText(/You have reached your check limit of /);
    expectTileDisabled('Detect broken links');
  });

  it('disables templates for viewers', async () => {
    runTestAsViewer();
    await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });
    await screen.findByText('Detect broken links');
    expectTileDisabled('Detect broken links');
  });

  it('disables the WebSocket example, with a reason, when the scripted limit is reached', async () => {
    await renderChooseCheckGroup({ scriptedLimit: 0, tab: ChooseCheckTab.Template });

    await waitFor(() =>
      expect(within(getTile('Test a WebSocket API')).getByText(SCRIPTED_LIMIT_REASON)).toBeInTheDocument()
    );
    expectTileDisabled('Test a WebSocket API');
  });

  it('disables the WebSocket example when user is HG Free user over the execution limit', async () => {
    runTestAsHGFreeUserOverLimit();
    await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });

    await screen.findByText(/You have reached your monthly execution limit of/);
    await waitFor(() => expectTileDisabled('Test a WebSocket API'));
  });
});
