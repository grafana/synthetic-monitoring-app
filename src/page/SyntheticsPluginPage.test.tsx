import React from 'react';
import { checkTerms, TERMS_AND_CONDITIONS_REFRESH_EVENT, useAssistant } from '@grafana/assistant';
import { act, render as rtlRender, screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';
import { mockFeatureToggles, runTestWithoutPermissions } from 'test/utils';

import { FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import {
  getSyntheticsPageNav,
  OVERVIEW_BREADCRUMB_URL,
  SyntheticsTab,
  type SyntheticsTabVisibility,
} from './SyntheticsPageNav';
import { SyntheticsPluginPage } from './SyntheticsPluginPage';

const ALL_TABS_VISIBLE: SyntheticsTabVisibility = { checks: true, probes: true, checkSuggestions: true };
const VISIBLE_TABS = ['Overview', 'Checks', 'Probes', 'Check Suggestions', 'Configuration'];
const AVAILABLE_ASSISTANT: ReturnType<typeof useAssistant> = {
  isAvailable: true,
  isLoading: false,
  openAssistant: jest.fn(),
  closeAssistant: jest.fn(),
  toggleAssistant: jest.fn(),
};

describe('getSyntheticsPageNav', () => {
  it('lists Overview, Checks, Probes, Check Suggestions, and Configuration tabs', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE);

    expect(nav.children?.map((tab) => tab.text)).toEqual(VISIBLE_TABS);
  });

  it('places Probes third and Configuration last in the tab row', () => {
    const tabs = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE).children?.map((tab) => tab.text);

    expect(tabs?.[2]).toBe('Probes');
    expect(tabs?.at(-1)).toBe('Configuration');
  });

  it('only lists the optional tabs that are visible', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Home, { checks: false, probes: false, checkSuggestions: false });

    expect(nav.children?.map((tab) => tab.text)).toEqual(['Overview', 'Configuration']);
  });

  it('links the Check Suggestions tab to its page without marking it active', () => {
    const checkSuggestions = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE).children?.find(
      (tab) => tab.text === 'Check Suggestions'
    );

    expect(checkSuggestions?.url).toBe(getRoute(AppRoutes.ReliabilityInbox));
    expect(checkSuggestions?.active).toBeFalsy();
  });

  it('keeps the Check Suggestions tab on its own page while its gate is closed', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.CheckSuggestions, { ...ALL_TABS_VISIBLE, checkSuggestions: false });

    expect(nav.children?.find((tab) => tab.text === 'Check Suggestions')).toMatchObject({ active: true });
  });

  it('uses a distinct Overview crumb URL so Grafana keeps the Synthetics section crumb', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE);

    expect(nav.text).toBe('Overview');
    expect(nav.url).toBe(OVERVIEW_BREADCRUMB_URL);
    expect(nav.hideFromBreadcrumbs).toBeFalsy();
    expect(nav.children?.[0]).toMatchObject({ text: 'Overview', active: true });
  });

  it.each([SyntheticsTab.Checks, SyntheticsTab.Probes, SyntheticsTab.CheckSuggestions, SyntheticsTab.Configuration])(
    'keeps pageNav out of breadcrumbs on the %s tab so crumbs are not repeated',
    (tab) => {
      expect(getSyntheticsPageNav(tab, ALL_TABS_VISIBLE).hideFromBreadcrumbs).toBe(true);
    }
  );

  it("shows Grafana's new-feature badge on the Check Suggestions tab", () => {
    const checkSuggestions = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE).children?.find(
      (tab) => tab.text === 'Check Suggestions'
    );
    const Suffix = checkSuggestions?.tabSuffix;

    expect(Suffix).toBeDefined();
    if (!Suffix) {
      return;
    }

    rtlRender(<Suffix />);
    expect(screen.getByText(/New/i)).toBeInTheDocument();
  });

  it.each([
    [SyntheticsTab.Home, 'Overview'],
    [SyntheticsTab.Checks, 'Checks'],
    [SyntheticsTab.Probes, 'Probes'],
    [SyntheticsTab.CheckSuggestions, 'Check Suggestions'],
    [SyntheticsTab.Configuration, 'Configuration'],
  ])('marks %s as the active tab', (tab, label) => {
    const activeTabs = getSyntheticsPageNav(tab, ALL_TABS_VISIBLE).children?.filter((child) => child.active);

    expect(activeTabs?.map((child) => child.text)).toEqual([label]);
  });
});

function renderPage(activeTab = SyntheticsTab.Home) {
  return render(
    <SyntheticsPluginPage activeTab={activeTab}>
      <div>tab content</div>
    </SyntheticsPluginPage>
  );
}

describe('SyntheticsPluginPage', () => {
  beforeEach(() => {
    jest.mocked(useAssistant).mockReturnValue(AVAILABLE_ASSISTANT);
    jest.mocked(checkTerms).mockResolvedValue(true);
  });

  it('renders the Synthetics page title', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Synthetics' })).toBeInTheDocument();
  });

  it.each([
    [SyntheticsTab.Home, 'Overview'],
    [SyntheticsTab.Checks, 'Checks'],
    [SyntheticsTab.Probes, 'Probes'],
    [SyntheticsTab.CheckSuggestions, 'Check Suggestions'],
    [SyntheticsTab.Configuration, 'Configuration'],
  ])('shows %s as the active tab', async (tab, label) => {
    renderPage(tab);

    expect(await screen.findByRole('tab', { name: label, selected: true })).toBeInTheDocument();
  });

  it('hides the Check Suggestions tab while its flag is disabled', async () => {
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Check Suggestions' })).not.toBeInTheDocument();
  });

  it('links the Check Suggestions tab to its page when the flag is enabled', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Check Suggestions' })).toHaveAttribute(
      'href',
      getRoute(AppRoutes.ReliabilityInbox)
    );
  });

  it('hides the Check Suggestions tab when Grafana Assistant is unavailable', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    jest.mocked(useAssistant).mockReturnValue({ ...AVAILABLE_ASSISTANT, isAvailable: false });
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Check Suggestions' })).not.toBeInTheDocument();
    expect(checkTerms).not.toHaveBeenCalled();
  });

  it('shows the Check Suggestions tab once the Assistant terms are accepted', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    jest.mocked(checkTerms).mockResolvedValue(false);
    renderPage();

    await waitFor(() => expect(checkTerms).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Check Suggestions' })).not.toBeInTheDocument();

    jest.mocked(checkTerms).mockResolvedValue(true);
    act(() => {
      document.dispatchEvent(new Event(TERMS_AND_CONDITIONS_REFRESH_EVENT));
    });

    expect(await screen.findByRole('tab', { name: 'Check Suggestions' })).toBeInTheDocument();
  });

  it('keeps the Check Suggestions tab across pages without re-checking the Assistant terms', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    const { rerender } = renderPage();

    expect(await screen.findByRole('tab', { name: 'Check Suggestions' })).toBeInTheDocument();

    // Each page renders its own SyntheticsPluginPage, so moving to another page remounts it.
    rerender(
      <SyntheticsPluginPage key="checks" activeTab={SyntheticsTab.Checks}>
        <div>tab content</div>
      </SyntheticsPluginPage>
    );

    expect(screen.getByRole('tab', { name: 'Checks', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Check Suggestions' })).toBeInTheDocument();
    expect(checkTerms).toHaveBeenCalledTimes(1);
  });

  it('hides the Checks and Check Suggestions tabs from users who cannot read checks', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    runTestWithoutPermissions('grafana-synthetic-monitoring-app.checks:read');
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Probes' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Checks' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Check Suggestions' })).not.toBeInTheDocument();
  });

  it('hides the Probes tab from users who cannot read probes', async () => {
    runTestWithoutPermissions('grafana-synthetic-monitoring-app.probes:read');
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Probes' })).not.toBeInTheDocument();
  });
});
