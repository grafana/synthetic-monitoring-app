import React from 'react';
import { checkTerms, TERMS_AND_CONDITIONS_REFRESH_EVENT, useAssistant } from '@grafana/assistant';
import { act, render as rtlRender, screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';
import { mockFeatureToggles, runTestWithoutPermissions } from 'test/utils';

import { FeatureName } from 'types';
import { createNavModel } from 'utils';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import pluginManifest from '../plugin.json';
import {
  getSyntheticsPageNav,
  getSyntheticsSectionNav,
  OVERVIEW_BREADCRUMB_URL,
  SyntheticsTab,
  type SyntheticsTabVisibility,
} from './SyntheticsPageNav';
import { SyntheticsPluginPage } from './SyntheticsPluginPage';

const ALL_TABS_VISIBLE: SyntheticsTabVisibility = {
  checks: true,
  probes: true,
  recommendations: true,
  checkSuggestions: true,
};
const VISIBLE_TABS = ['Overview', 'Checks', 'Probes', 'Recommendations', 'Check Suggestions', 'Configuration'];
// These tabs carry a NEW badge, which is part of their accessible name.
const RECOMMENDATIONS_TAB = /^recommendations/i;
const CHECK_SUGGESTIONS_TAB = /^check suggestions/i;
const AVAILABLE_ASSISTANT: ReturnType<typeof useAssistant> = {
  isAvailable: true,
  isLoading: false,
  openAssistant: jest.fn(),
  closeAssistant: jest.fn(),
  toggleAssistant: jest.fn(),
};

function findTab(activeTab: SyntheticsTab, text: string) {
  return getSyntheticsPageNav(activeTab, ALL_TABS_VISIBLE).children?.find((tab) => tab.text === text);
}

describe('getSyntheticsPageNav', () => {
  it('lists Overview, Checks, Probes, Recommendations, Check Suggestions, and Configuration tabs', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE);

    expect(nav.children?.map((tab) => tab.text)).toEqual(VISIBLE_TABS);
  });

  it('places Probes third and Configuration last in the tab row', () => {
    const tabs = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE).children?.map((tab) => tab.text);

    expect(tabs?.[2]).toBe('Probes');
    expect(tabs?.at(-1)).toBe('Configuration');
  });

  it('only lists the optional tabs that are visible', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Home, {
      checks: false,
      probes: false,
      recommendations: false,
      checkSuggestions: false,
    });

    expect(nav.children?.map((tab) => tab.text)).toEqual(['Overview', 'Configuration']);
  });

  it('links the Recommendations tab to its route, tagged as a tab click', () => {
    expect(findTab(SyntheticsTab.Home, 'Recommendations')?.url).toBe(
      `${getRoute(AppRoutes.CheckRecommendations)}?source=tab`
    );
  });

  it('links the Check Suggestions tab to its page without marking it active', () => {
    const checkSuggestions = findTab(SyntheticsTab.Home, 'Check Suggestions');

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

  it.each([
    [SyntheticsTab.Checks, 'Checks', AppRoutes.Checks],
    [SyntheticsTab.Probes, 'Probes', AppRoutes.Probes],
    [SyntheticsTab.Recommendations, 'Recommendations', AppRoutes.CheckRecommendations],
    [SyntheticsTab.CheckSuggestions, 'Check Suggestions', AppRoutes.ReliabilityInbox],
    [SyntheticsTab.Configuration, 'Configuration', AppRoutes.Config],
  ])('lets Grafana append the %s tab once after the Synthetics breadcrumb', (tab, label, route) => {
    const nav = getSyntheticsPageNav(tab, ALL_TABS_VISIBLE);

    expect(nav.text).toBe('Synthetics');
    // Grafana deduplicates by URL, not label: /home would repeat Synthetics.
    expect(nav.url).toBe(pluginManifest.includes.find((entry) => 'defaultNav' in entry && entry.defaultNav)?.path);
    expect(nav.hideFromBreadcrumbs).toBeFalsy();
    const activeIndex = nav.children?.findIndex((child) => child.active) ?? -1;
    // Grafana adds the active child only when its index is greater than zero.
    expect(activeIndex).toBeGreaterThan(0);
    const activeChild = nav.children?.[activeIndex];
    expect(activeChild?.text).toBe(label);
    expect(activeChild?.url?.split('?')[0]).toBe(getRoute(route));
  });

  it.each(['Recommendations', 'Check Suggestions'])('shows the NEW badge on the %s tab', (text) => {
    const Suffix = findTab(SyntheticsTab.Home, text)?.tabSuffix;

    expect(Suffix).toBeDefined();
    if (!Suffix) {
      return;
    }

    rtlRender(<Suffix />);
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it.each([
    [SyntheticsTab.Home, 'Overview'],
    [SyntheticsTab.Checks, 'Checks'],
    [SyntheticsTab.Probes, 'Probes'],
    [SyntheticsTab.Recommendations, 'Recommendations'],
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
    [SyntheticsTab.CheckSuggestions, CHECK_SUGGESTIONS_TAB],
    [SyntheticsTab.Configuration, 'Configuration'],
  ])('shows %s as the active tab', async (tab, name) => {
    renderPage(tab);

    expect(await screen.findByRole('tab', { name, selected: true })).toBeInTheDocument();
  });

  it('hides the Recommendations tab while its flag is disabled', async () => {
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: RECOMMENDATIONS_TAB })).not.toBeInTheDocument();
  });

  it('shows the Recommendations tab when its flag is enabled, selected on its own page', async () => {
    mockFeatureToggles({ [FeatureName.Recommendations]: true });
    renderPage(SyntheticsTab.Recommendations);

    expect(await screen.findByRole('tab', { name: RECOMMENDATIONS_TAB, selected: true })).toHaveAttribute(
      'href',
      `${getRoute(AppRoutes.CheckRecommendations)}?source=tab`
    );
  });

  it('hides the Check Suggestions tab while its flag is disabled', async () => {
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: CHECK_SUGGESTIONS_TAB })).not.toBeInTheDocument();
  });

  it('links the Check Suggestions tab to its page when the flag is enabled', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    renderPage();

    expect(await screen.findByRole('tab', { name: CHECK_SUGGESTIONS_TAB })).toHaveAttribute(
      'href',
      getRoute(AppRoutes.ReliabilityInbox)
    );
  });

  it('hides the Check Suggestions tab when Grafana Assistant is unavailable', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    jest.mocked(useAssistant).mockReturnValue({ ...AVAILABLE_ASSISTANT, isAvailable: false });
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: CHECK_SUGGESTIONS_TAB })).not.toBeInTheDocument();
    expect(checkTerms).not.toHaveBeenCalled();
  });

  it('shows the Check Suggestions tab once the Assistant terms are accepted', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    jest.mocked(checkTerms).mockResolvedValue(false);
    renderPage();

    await waitFor(() => expect(checkTerms).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: CHECK_SUGGESTIONS_TAB })).not.toBeInTheDocument();

    jest.mocked(checkTerms).mockResolvedValue(true);
    act(() => {
      document.dispatchEvent(new Event(TERMS_AND_CONDITIONS_REFRESH_EVENT));
    });

    expect(await screen.findByRole('tab', { name: CHECK_SUGGESTIONS_TAB })).toBeInTheDocument();
  });

  it('keeps the Check Suggestions tab across pages without re-checking the Assistant terms', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    const { rerender } = renderPage();

    expect(await screen.findByRole('tab', { name: CHECK_SUGGESTIONS_TAB })).toBeInTheDocument();

    // Each page renders its own SyntheticsPluginPage, so moving to another page remounts it.
    rerender(
      <SyntheticsPluginPage key="checks" activeTab={SyntheticsTab.Checks}>
        <div>tab content</div>
      </SyntheticsPluginPage>
    );

    expect(screen.getByRole('tab', { name: 'Checks', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: CHECK_SUGGESTIONS_TAB })).toBeInTheDocument();
    expect(checkTerms).toHaveBeenCalledTimes(1);
  });

  it('hides the Checks, Recommendations and Check Suggestions tabs from users who cannot read checks', async () => {
    mockFeatureToggles({ [FeatureName.Recommendations]: true, [FeatureName.CheckSuggestions]: true });
    runTestWithoutPermissions('grafana-synthetic-monitoring-app.checks:read');
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Probes' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Checks' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: RECOMMENDATIONS_TAB })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: CHECK_SUGGESTIONS_TAB })).not.toBeInTheDocument();
  });

  it('hides the Probes tab from users who cannot read probes', async () => {
    runTestWithoutPermissions('grafana-synthetic-monitoring-app.probes:read');
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Probes' })).not.toBeInTheDocument();
  });
});

describe('detail page breadcrumbs', () => {
  it.each([
    ['Checks', AppRoutes.Checks],
    ['Probes', AppRoutes.Probes],
  ] as const)('links a detail page back to %s without duplicating Synthetics', (section, route) => {
    const nav = createNavModel(getSyntheticsSectionNav(section), [{ text: 'Resource name' }]);

    expect(nav.text).toBe('Resource name');
    expect(nav.parentItem).toMatchObject({ text: section, url: getRoute(route) });
    expect(nav.parentItem?.parentItem).toEqual({
      text: 'Synthetics',
      url: pluginManifest.includes.find((entry) => 'defaultNav' in entry && entry.defaultNav)?.path,
    });
    expect(nav.children).toBeUndefined();
  });
});
