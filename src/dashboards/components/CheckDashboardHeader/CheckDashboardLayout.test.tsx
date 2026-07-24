import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckDashboardHeaderProfile, CheckHeaderDefinitionModel } from './CheckDashboardHeader.types';

import { CheckDashboardLayout } from './CheckDashboardLayout';

const originalResizeObserver = global.ResizeObserver;

jest.mock('contexts/DashboardPanelScopeProvider', () => ({
  DashboardPanelScopeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-panel-scope-provider">{children}</div>
  ),
}));
jest.mock('contexts/DashboardComparisonProvider', () => ({
  DashboardComparisonProvider: ({
    children,
    profile,
  }: {
    children: React.ReactNode;
    profile?: unknown;
  }) => (
    <div data-has-comparison-profile={String(Boolean(profile))} data-testid="dashboard-comparison-provider">
      {children}
    </div>
  ),
}));
jest.mock('./CheckIdentitySummary', () => ({
  CheckIdentitySummary: () => <div data-testid="dashboard-band">Check identity</div>,
}));
jest.mock('./DashboardScopeControls', () => ({
  DashboardTimeControls: () => <div data-testid="dashboard-band">Dashboard time controls</div>,
  DashboardPanelScopeControls: ({ filters }: { filters?: React.ReactNode }) => (
    <div data-testid="dashboard-band">
      Panel filters
      {filters}
    </div>
  ),
}));
jest.mock('./ObservedPerformanceSummary', () => ({
  ObservedPerformanceSummary: () => <div data-testid="dashboard-band">Observed performance</div>,
}));
jest.mock('./CheckDefinitionSummary', () => ({
  CheckDefinitionSummary: () => <div data-testid="dashboard-band">Check configuration</div>,
}));

const definition: CheckHeaderDefinitionModel = {
  title: 'HTTP check',
  typeLabel: 'HTTP',
  facts: [],
  labels: [],
};

const profile: CheckDashboardHeaderProfile<typeof BASIC_HTTP_CHECK> = {
  getDefinition: jest.fn(() => definition),
  getMetrics: jest.fn(() => []),
  Narrative: () => null,
  Comparison: {
    createExecutionPresenceDefinition: jest.fn(() => ({
      id: 'execution-presence',
      pluginId: 'timeseries',
      fieldConfig: { defaults: {}, overrides: [] },
      options: {},
      targets: [],
    })),
  },
};

describe('CheckDashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 40,
      height: 40,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(global, 'ResizeObserver', {
      configurable: true,
      value: originalResizeObserver,
      writable: true,
    });
  });

  it('keeps global header bands outside panel scope and scoped filters with dashboard content', () => {
    render(
      <CheckDashboardLayout
        check={BASIC_HTTP_CHECK}
        filters={<span>Execution filters</span>}
        profile={profile}
      >
        <div data-testid="dashboard-content">Panels</div>
      </CheckDashboardLayout>
    );

    const layout = screen.getByTestId('check-dashboard-layout');
    const bands = within(layout).getAllByTestId('dashboard-band');

    expect(bands.map((band) => band.textContent)).toEqual([
      'Check identity',
      'Check configuration',
      'Dashboard time controls',
      'Observed performance',
      'Panel filtersExecution filters',
    ]);
    expect(within(layout).getByTestId('dashboard-content')).toHaveTextContent('Panels');
    expect(profile.getDefinition).toHaveBeenCalledTimes(1);
    expect(within(layout).getByText('Check configuration').parentElement).not.toBe(layout);

    const panelScope = within(layout).getByTestId('dashboard-panel-scope-provider');
    const stickyTime = within(layout).getByTestId('dashboard-time-sticky');
    const comparisonProvider = within(layout).getByTestId('dashboard-comparison-provider');
    expect(comparisonProvider).toHaveAttribute('data-has-comparison-profile', 'true');
    expect(comparisonProvider).toContainElement(within(layout).getByTestId('dashboard-time-sticky-sentinel'));
    expect(comparisonProvider).toContainElement(stickyTime);
    expect(comparisonProvider).toContainElement(within(layout).getByText('Observed performance'));
    expect(comparisonProvider).not.toContainElement(within(layout).getByText('Check configuration'));
    expect(comparisonProvider).not.toContainElement(panelScope);
    expect(panelScope).toContainElement(bands[4]);
    expect(panelScope).toContainElement(within(layout).getByTestId('dashboard-content'));
    expect(panelScope).not.toContainElement(within(layout).getByText('Observed performance'));

    const stickyScope = within(layout).getByTestId('dashboard-panel-scope-sticky');
    expect(stickyTime).toHaveStyle({ position: 'sticky', top: '48px' });
    expect(stickyTime).toHaveAttribute('data-sticky', 'false');
    expect(within(layout).getByTestId('dashboard-time-sticky-sentinel')).toBeInTheDocument();
    expect(stickyScope).toHaveStyle({ position: 'sticky', top: '88px' });
    expect(stickyScope).toHaveAttribute('data-sticky', 'false');
    expect(within(layout).getByTestId('dashboard-panel-scope-sticky-sentinel')).toBeInTheDocument();
    expect(stickyScope.parentElement).toBe(panelScope);
    expect(panelScope).not.toContainElement(stickyTime);
    expect(layout).toContainElement(screen.getByTestId('dashboard-content'));
  });

  it('tracks the global and panel sticky states independently', () => {
    const observerCallbacks: Array<{
      active: boolean;
      callback: IntersectionObserverCallback;
      rootMargin?: string;
      target?: Element;
    }> = [];

    jest.mocked(IntersectionObserver).mockImplementation((callback, options) => {
      const observerRecord = {
        active: true,
        callback,
        rootMargin: options?.rootMargin,
        target: undefined as Element | undefined,
      };
      observerCallbacks.push(observerRecord);

      return {
        observe: jest.fn((target: Element) => {
          observerRecord.target = target;
        }),
        unobserve: jest.fn(),
        disconnect: jest.fn(() => {
          observerRecord.active = false;
        }),
        takeRecords: jest.fn(),
        root: null,
        rootMargin: '',
        thresholds: [],
      };
    });

    render(
      <CheckDashboardLayout check={BASIC_HTTP_CHECK} profile={profile}>
        <div>Panels</div>
      </CheckDashboardLayout>
    );

    const stickyTime = screen.getByTestId('dashboard-time-sticky');
    const stickyScope = screen.getByTestId('dashboard-panel-scope-sticky');
    expect(stickyTime).toHaveAttribute('data-sticky', 'false');
    expect(stickyScope).toHaveAttribute('data-sticky', 'false');
    expect(observerCallbacks.filter(({ active }) => active)).toHaveLength(2);

    act(() => {
      observerCallbacks
        .find(
          ({ active, target }) =>
            active && target?.getAttribute('data-testid') === 'dashboard-time-sticky-sentinel'
        )
        ?.callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(stickyTime).toHaveAttribute('data-sticky', 'true');
    expect(stickyScope).toHaveAttribute('data-sticky', 'false');

    act(() => {
      observerCallbacks
        .find(
          ({ active, rootMargin, target }) =>
            active &&
            rootMargin === '-88px 0px 0px 0px' &&
            target?.getAttribute('data-testid') === 'dashboard-panel-scope-sticky-sentinel'
        )
        ?.callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(stickyTime).toHaveAttribute('data-sticky', 'true');
    expect(stickyScope).toHaveAttribute('data-sticky', 'true');
  });

  it('moves the panel sticky boundary when the global controls resize', () => {
    let measuredHeight = 40;
    let resizeCallback: ResizeObserverCallback = () => undefined;

    jest.mocked(HTMLElement.prototype.getBoundingClientRect).mockImplementation(
      () =>
        ({
          bottom: measuredHeight,
          height: measuredHeight,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );
    global.ResizeObserver = jest.fn((callback: ResizeObserverCallback) => {
      resizeCallback = callback;

      return {
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
      };
    }) as unknown as typeof ResizeObserver;

    render(
      <CheckDashboardLayout check={BASIC_HTTP_CHECK} profile={profile}>
        <div>Panels</div>
      </CheckDashboardLayout>
    );

    const stickyScope = screen.getByTestId('dashboard-panel-scope-sticky');
    expect(stickyScope).toHaveStyle({ top: '88px' });

    measuredHeight = 56;
    act(() => {
      resizeCallback([], {} as ResizeObserver);
    });

    expect(stickyScope).toHaveStyle({ top: '104px' });
  });
});
