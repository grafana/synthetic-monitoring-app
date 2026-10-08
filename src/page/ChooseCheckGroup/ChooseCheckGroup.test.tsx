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

interface RenderOptions {
  checkLimit?: number;
  scriptedLimit?: number;
  /** A raw value, so tests can also request tabs that do not exist. */
  tab?: string;
}

async function renderChooseCheckGroup({ checkLimit = 10, scriptedLimit = 10, tab }: RenderOptions = {}) {
  server.use(
    apiRoute('getTenantLimits', {
      result: () => ({
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

// Tiles render as disabled placeholders until limits load, then are replaced by real links,
// so each attempt has to query afresh rather than wait on the first element found.
function findEnabledLink(name: string) {
  return waitFor(() => {
    const link = screen.getByRole('link', { name });
    expect(link).not.toHaveAttribute('aria-disabled');

    return link;
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('tabs', () => {
  it('opens on the check type tab', async () => {
    await renderChooseCheckGroup();

    expect(getActiveTab()).toHaveTextContent('By check type');
    expect(getSection('API endpoint')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Detect broken links' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AGENT_TOOLS[0] })).not.toBeInTheDocument();
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
  it('groups every check type into an API endpoint and a multi-step section', async () => {
    await renderChooseCheckGroup();

    const apiSection = getSection('API endpoint');
    API_ENDPOINT_TYPES.forEach((name) => {
      expect(within(apiSection).getByRole('link', { name })).toBeInTheDocument();
    });

    const journeySection = getSection('Multi-step and scripted');
    JOURNEY_TYPES.forEach((name) => {
      expect(within(journeySection).getByRole('link', { name })).toBeInTheDocument();
    });
  });

  it('describes each check type on its tile', async () => {
    await renderChooseCheckGroup();

    expect(await findEnabledLink('HTTP')).toHaveAccessibleDescription(
      'Request a URL and check its status, response time and SSL certificate.'
    );
    expect(await findEnabledLink('Browser')).toHaveAccessibleDescription(
      'Script a real browser to load pages and interact like a user.'
    );
  });

  it('links API endpoint tiles to the API endpoint form with their request type selected', async () => {
    await renderChooseCheckGroup();

    expect(await findEnabledLink('HTTP')).toHaveAttribute(
      'href',
      expect.stringContaining(`/${CheckTypeGroup.ApiTest}?checkType=${CheckType.Http}`)
    );
    expect(await findEnabledLink('Traceroute')).toHaveAttribute(
      'href',
      expect.stringContaining(`/${CheckTypeGroup.ApiTest}?checkType=${CheckType.Traceroute}`)
    );
  });

  it('links multi-step and scripted tiles to their own forms', async () => {
    await renderChooseCheckGroup();

    expect(await findEnabledLink('Multi Step')).toHaveAttribute(
      'href',
      expect.stringMatching(new RegExp(`/${CheckTypeGroup.MultiStep}$`))
    );
    expect(await findEnabledLink('Scripted')).toHaveAttribute(
      'href',
      expect.stringMatching(new RegExp(`/${CheckTypeGroup.Scripted}$`))
    );
    expect(await findEnabledLink('Browser')).toHaveAttribute(
      'href',
      expect.stringMatching(new RegExp(`/${CheckTypeGroup.Browser}$`))
    );
  });

  it('tracks the request type when an API endpoint tile is selected', async () => {
    const { user } = await renderChooseCheckGroup();

    await user.click(await findEnabledLink('DNS'));

    expect(trackAddCheckTypeButtonClicked).toHaveBeenCalledWith({
      checkTypeGroup: CheckTypeGroup.ApiTest,
      protocol: CheckType.Dns,
    });
    expect(trackAddCheckTypeGroupButtonClicked).not.toHaveBeenCalled();
  });

  it('tracks the group when a multi-step or scripted tile is selected', async () => {
    const { user } = await renderChooseCheckGroup();

    await user.click(await findEnabledLink('Browser'));

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

    [...API_ENDPOINT_TYPES, ...JOURNEY_TYPES].forEach((name) => {
      expect(screen.getByRole('link', { name })).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('disables only scripted and multi-step tiles, with a reason, when the scripted limit is reached', async () => {
    await renderChooseCheckGroup({ scriptedLimit: 0 });

    // The reason only appears once limits have loaded, so waiting for it also waits for readiness.
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Scripted' })).toHaveAccessibleDescription(
        expect.stringContaining('Scripted and Multi Step check limit reached')
      )
    );
    expect(screen.getByRole('link', { name: 'Scripted' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: 'Multi Step' })).toHaveAttribute('aria-disabled', 'true');

    expect(screen.getByRole('link', { name: 'HTTP' })).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('link', { name: 'Browser' })).not.toHaveAttribute('aria-disabled');
  });
});

describe('template tab', () => {
  it('offers the templates and the WebSocket example', async () => {
    await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });

    expect(await screen.findByRole('button', { name: 'Detect broken links' })).toHaveAccessibleDescription(
      'Check a page for links that no longer work.'
    );
    expect(await findEnabledLink('Test a WebSocket API')).toHaveAttribute(
      'href',
      expect.stringContaining(`/${CheckTypeGroup.Scripted}?example=websocket`)
    );
  });

  it('tracks the WebSocket example as a scripted protocol selection', async () => {
    const { user } = await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });

    await user.click(await findEnabledLink('Test a WebSocket API'));

    expect(trackAddCheckTypeButtonClicked).toHaveBeenCalledWith({
      checkTypeGroup: CheckTypeGroup.Scripted,
      protocol: 'WebSockets',
    });
  });

  it('opens the template drawer and tracks selection without a feature flag', async () => {
    const reportInteraction = jest.spyOn(jest.requireMock('@grafana/runtime'), 'reportInteraction');
    const { user } = await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });
    const card = await screen.findByRole('button', { name: 'Detect broken links' });
    await waitFor(() => expect(card).toBeEnabled());
    await user.click(card);
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
    expect(screen.getByRole('button', { name: 'Detect broken links' })).toBeDisabled();
  });

  it('disables templates for viewers', async () => {
    runTestAsViewer();
    await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });
    expect(await screen.findByRole('button', { name: 'Detect broken links' })).toBeDisabled();
  });

  it('disables the WebSocket example, with a reason, when the scripted limit is reached', async () => {
    await renderChooseCheckGroup({ scriptedLimit: 0, tab: ChooseCheckTab.Template });

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Test a WebSocket API' })).toHaveAccessibleDescription(
        expect.stringContaining('Scripted and Multi Step check limit reached')
      )
    );
    expect(screen.getByRole('link', { name: 'Test a WebSocket API' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables the WebSocket example when user is HG Free user over the execution limit', async () => {
    runTestAsHGFreeUserOverLimit();
    await renderChooseCheckGroup({ tab: ChooseCheckTab.Template });

    await screen.findByText(/You have reached your monthly execution limit of/);
    expect(screen.getByRole('link', { name: 'Test a WebSocket API' })).toHaveAttribute('aria-disabled', 'true');
  });
});
