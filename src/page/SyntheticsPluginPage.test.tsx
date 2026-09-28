import React from 'react';
import { render as rtlRender, screen } from '@testing-library/react';
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

const ALL_TABS_VISIBLE: SyntheticsTabVisibility = { checks: true, probes: true, recommendations: true };
const VISIBLE_TABS = ['Overview', 'Checks', 'Probes', 'Recommendations', 'Configuration'];

describe('getSyntheticsPageNav', () => {
  it('lists Overview, Checks, Probes, Recommendations, and Configuration tabs', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE);

    expect(nav.children?.map((tab) => tab.text)).toEqual(VISIBLE_TABS);
  });

  it('places Probes third and Configuration last in the tab row', () => {
    const tabs = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE).children?.map((tab) => tab.text);

    expect(tabs?.[2]).toBe('Probes');
    expect(tabs?.at(-1)).toBe('Configuration');
  });

  it('only lists the optional tabs that are visible', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Home, { checks: false, probes: false, recommendations: false });

    expect(nav.children?.map((tab) => tab.text)).toEqual(['Overview', 'Configuration']);
  });

  it('links Recommendations to Check Suggestions without marking it active', () => {
    const recommendations = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE).children?.find(
      (tab) => tab.text === 'Recommendations'
    );

    expect(recommendations?.url).toBe(getRoute(AppRoutes.ReliabilityInbox));
    expect(recommendations?.active).toBeFalsy();
  });

  it('uses a distinct Overview crumb URL so Grafana keeps the Synthetics section crumb', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE);

    expect(nav.text).toBe('Overview');
    expect(nav.url).toBe(OVERVIEW_BREADCRUMB_URL);
    expect(nav.hideFromBreadcrumbs).toBeFalsy();
    expect(nav.children?.[0]).toMatchObject({ text: 'Overview', active: true });
  });

  it.each([SyntheticsTab.Checks, SyntheticsTab.Probes, SyntheticsTab.Configuration])(
    'keeps pageNav out of breadcrumbs on the %s tab so crumbs are not repeated',
    (tab) => {
      expect(getSyntheticsPageNav(tab, ALL_TABS_VISIBLE).hideFromBreadcrumbs).toBe(true);
    }
  );

  it("shows Grafana's new-feature badge on the Recommendations tab", () => {
    const recommendations = getSyntheticsPageNav(SyntheticsTab.Home, ALL_TABS_VISIBLE).children?.find(
      (tab) => tab.text === 'Recommendations'
    );
    const Suffix = recommendations?.tabSuffix;

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
  it('renders the Synthetics page title', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Synthetics' })).toBeInTheDocument();
  });

  it.each([
    [SyntheticsTab.Home, 'Overview'],
    [SyntheticsTab.Checks, 'Checks'],
    [SyntheticsTab.Probes, 'Probes'],
    [SyntheticsTab.Configuration, 'Configuration'],
  ])('shows %s as the active tab', async (tab, label) => {
    renderPage(tab);

    expect(await screen.findByRole('tab', { name: label, selected: true })).toBeInTheDocument();
  });

  it('hides the Recommendations tab while Check Suggestions is disabled', async () => {
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Recommendations' })).not.toBeInTheDocument();
  });

  it('links the Recommendations tab to Check Suggestions when it is enabled', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Recommendations' })).toHaveAttribute(
      'href',
      getRoute(AppRoutes.ReliabilityInbox)
    );
  });

  it('hides the Checks and Recommendations tabs from users who cannot read checks', async () => {
    mockFeatureToggles({ [FeatureName.CheckSuggestions]: true });
    runTestWithoutPermissions('grafana-synthetic-monitoring-app.checks:read');
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Probes' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Checks' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Recommendations' })).not.toBeInTheDocument();
  });

  it('hides the Probes tab from users who cannot read probes', async () => {
    runTestWithoutPermissions('grafana-synthetic-monitoring-app.probes:read');
    renderPage();

    expect(await screen.findByRole('tab', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Probes' })).not.toBeInTheDocument();
  });
});
