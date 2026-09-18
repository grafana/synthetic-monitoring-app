import React from 'react';
import { render } from '@testing-library/react';
import { CONFIG_TEST_ID } from 'test/dataTestIds';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import { getSyntheticsPageNav, OVERVIEW_BREADCRUMB_URL, SyntheticsTab } from './SyntheticsPageNav';
import { SyntheticsPluginPage } from './SyntheticsPluginPage';

const VISIBLE_TABS = ['Overview', 'Checks', 'Probes', 'Recommendations', 'Configuration'];

describe('getSyntheticsPageNav', () => {
  it('lists Overview, Checks, Probes, Recommendations, and Configuration tabs', () => {
    expect(getSyntheticsPageNav(SyntheticsTab.Home).children?.map((tab) => tab.text)).toEqual(VISIBLE_TABS);
  });

  it('places Probes third and Configuration last in the tab row', () => {
    const visibleTabs = getSyntheticsPageNav(SyntheticsTab.Home)
      .children?.filter((tab) => !tab.hideFromTabs)
      .map((tab) => tab.text);

    expect(visibleTabs?.[2]).toBe('Probes');
    expect(visibleTabs?.at(-1)).toBe('Configuration');
  });

  it('uses a distinct Overview crumb URL so Grafana keeps the Synthetics section crumb', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Home);

    expect(nav.text).toBe('Overview');
    expect(nav.url).toBe(OVERVIEW_BREADCRUMB_URL);
    expect(nav.hideFromBreadcrumbs).toBeFalsy();
    expect(nav.parentItem).toBeUndefined();
    expect(nav.children?.[0]).toMatchObject({ text: 'Overview', active: true });
  });

  it('keeps pageNav out of breadcrumbs on the Checks tab so crumbs are not repeated', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Checks);

    expect(nav.hideFromBreadcrumbs).toBe(true);
    expect(nav.parentItem).toBeUndefined();
  });

  it('keeps pageNav out of breadcrumbs on the Probes tab so crumbs are not repeated', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Probes);

    expect(nav.hideFromBreadcrumbs).toBe(true);
    expect(nav.url).toBe(getRoute(AppRoutes.Home));
    expect(nav.parentItem).toBeUndefined();
    expect(nav.children?.filter((tab) => !tab.hideFromTabs).map((tab) => tab.text)).toEqual(VISIBLE_TABS);
  });

  it('uses Recommendations as the crumb on the Recommendations tab', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Recommendations);

    expect(nav.text).toBe('Recommendations');
    expect(nav.hideFromBreadcrumbs).toBeFalsy();
    expect(nav.parentItem).toMatchObject({ text: 'Checks', hideFromBreadcrumbs: true });
    expect(nav.children?.filter((tab) => !tab.hideFromTabs).map((tab) => tab.text)).toEqual(VISIBLE_TABS);
  });

  it('keeps pageNav out of breadcrumbs on the Configuration tab so crumbs are not repeated', () => {
    const nav = getSyntheticsPageNav(SyntheticsTab.Configuration);

    expect(nav.text).toBe('Configuration');
    expect(nav.url).toBe(getRoute(AppRoutes.Config));
    expect(nav.hideFromBreadcrumbs).toBe(true);
    expect(nav.parentItem).toBeUndefined();
    expect(nav.children?.filter((tab) => !tab.hideFromTabs).map((tab) => tab.text)).toEqual(VISIBLE_TABS);
  });

  it('shows Grafana\'s new-feature badge on the Recommendations tab', () => {
    const recommendations = getSyntheticsPageNav(SyntheticsTab.Home).children?.find(
      (tab) => tab.text === 'Recommendations'
    );
    const Suffix = recommendations?.tabSuffix;

    expect(Suffix).toBeDefined();
    if (!Suffix) {
      return;
    }

    const { getByText } = render(<Suffix />);
    expect(getByText(/New/i)).toBeInTheDocument();
  });

  it.each([
    [SyntheticsTab.Home, 'Overview'],
    [SyntheticsTab.Checks, 'Checks'],
    [SyntheticsTab.Probes, 'Probes'],
    [SyntheticsTab.Configuration, 'Configuration'],
    [SyntheticsTab.Recommendations, 'Recommendations'],
  ])('marks %s as the active tab', (tab, label) => {
    const children = getSyntheticsPageNav(tab).children ?? [];
    const visibleActive = children.filter((child) => child.active && !child.hideFromTabs);

    expect(visibleActive).toHaveLength(1);
    expect(visibleActive[0]?.text).toBe(label);
  });
});

describe('SyntheticsPluginPage', () => {
  it('renders the Synthetics page title', () => {
    const { getByRole } = render(
      <SyntheticsPluginPage activeTab={SyntheticsTab.Home}>
        <div>home content</div>
      </SyntheticsPluginPage>
    );

    expect(getByRole('heading', { name: 'Synthetics' })).toBeInTheDocument();
  });

  it.each([
    [SyntheticsTab.Home, 'Overview'],
    [SyntheticsTab.Checks, 'Checks'],
    [SyntheticsTab.Probes, 'Probes'],
    [SyntheticsTab.Configuration, 'Configuration'],
    [SyntheticsTab.Recommendations, 'Recommendations'],
  ])('shows %s as the active tab', (tab, label) => {
    const { getByTestId } = render(
      <SyntheticsPluginPage activeTab={tab}>
        <div>tab content</div>
      </SyntheticsPluginPage>
    );

    expect(getByTestId(CONFIG_TEST_ID.layout.activeTab)).toHaveTextContent(label);
  });

  it('does not render a Configuration header action', () => {
    const { queryByRole } = render(
      <SyntheticsPluginPage activeTab={SyntheticsTab.Home}>
        <div>home content</div>
      </SyntheticsPluginPage>
    );

    expect(queryByRole('link', { name: 'Configuration' })).not.toBeInTheDocument();
  });
});
