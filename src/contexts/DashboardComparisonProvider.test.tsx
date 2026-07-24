import React from 'react';
import {
  MemoryRouter,
  type Navigator,
  UNSAFE_NavigationContext,
  useLocation,
  useNavigationType,
} from 'react-router';
import { FieldType, LoadingState, type PanelData } from '@grafana/data';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { type ComparisonReferenceSpec } from 'dashboards/comparison/comparisonReference.types';
import { useAppTime } from 'contexts/AppTimeProvider';
import { CheckDashboardProvider } from 'contexts/CheckDashboardProvider';

import {
  type CheckDashboardComparisonProfile,
  DashboardComparisonProvider,
  useComparisonReferenceAvailability,
  useDashboardComparison,
} from './DashboardComparisonProvider';

jest.mock('contexts/AppTimeProvider', () => ({
  useAppTime: jest.fn(),
}));
jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({
  useDashboardPanelQuery: jest.fn(),
}));

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const primary = {
  from: Date.UTC(2026, 6, 23, 12),
  to: Date.UTC(2026, 6, 23, 15),
};

const definition = {
  id: 'execution-presence',
  pluginId: 'timeseries',
  fieldConfig: { defaults: {}, overrides: [] },
  options: {},
  targets: [],
};

const baseProfile: CheckDashboardComparisonProfile<typeof BASIC_HTTP_CHECK> = {
  createExecutionPresenceDefinition: jest.fn(() => definition),
};

let appTime = {
  absolute: primary,
  timezone: 'utc',
};

function samplesEndingAt(to: number, hours = 24) {
  return Array.from({ length: hours }, (_, index) => ({
    at: to - (index + 0.5) * HOUR_MS,
    value: 1,
  }));
}

function panelData(
  samples: Array<{ at: number; value: number }>,
  {
    state = LoadingState.Done,
    errors,
    zeroFrames = false,
  }: {
    state?: LoadingState;
    errors?: PanelData['errors'];
    zeroFrames?: boolean;
  } = {}
): PanelData {
  return {
    state,
    errors,
    series: zeroFrames
      ? []
      : [
          {
            fields: [
              { name: 'Time', type: FieldType.time, values: samples.map(({ at }) => at) },
              { name: 'executions', type: FieldType.number, values: samples.map(({ value }) => value) },
            ],
          },
        ],
  } as PanelData;
}

function queryResult(
  samples: Array<{ at: number; value: number }> = [],
  {
    state,
    errors,
    isLoading = false,
    zeroFrames,
  }: {
    state?: LoadingState;
    errors?: PanelData['errors'];
    isLoading?: boolean;
    zeroFrames?: boolean;
  } = {}
) {
  return {
    panelData: panelData(samples, { state, errors, zeroFrames }),
    isLoading,
    menuItems: undefined,
    title: undefined,
  };
}

function ContextProbe() {
  const comparison = useDashboardComparison();
  const location = useLocation();
  const navigationType = useNavigationType();

  return (
    <>
      <output data-testid="comparison">{JSON.stringify(comparison)}</output>
      <output data-testid="search">{location.search}</output>
      <output data-testid="navigation-type">{navigationType}</output>
      <button onClick={() => comparison.setEnabled(true)}>enable</button>
      <button onClick={() => comparison.setEnabled(false)}>disable</button>
      <button onClick={() => comparison.setReference({ kind: 'previous' })}>previous</button>
      <button onClick={() => comparison.setReference({ kind: 'shifted', presetId: '14d' })}>14d</button>
    </>
  );
}

function AvailabilityProbe({
  reference,
  enabled,
}: {
  reference: ComparisonReferenceSpec;
  enabled: boolean;
}) {
  return <output data-testid="availability">{JSON.stringify(useComparisonReferenceAvailability(reference, enabled))}</output>;
}

function NavigatorCapture({ onCapture }: { onCapture: (navigator: Navigator) => void }) {
  const { navigator } = React.useContext(UNSAFE_NavigationContext);
  onCapture(navigator);

  return null;
}

function renderProvider({
  initialEntry = '/checks/1',
  profile = baseProfile,
  child,
  urlFormat = 'canonical',
}: {
  initialEntry?: string;
  profile?: CheckDashboardComparisonProfile<typeof BASIC_HTTP_CHECK>;
  child?: React.ReactNode;
  urlFormat?: 'canonical' | 'legacy';
} = {}) {
  let navigator: Navigator | undefined;
  const rendered = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <NavigatorCapture onCapture={(value) => (navigator = value)} />
      <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat={urlFormat}>
        <DashboardComparisonProvider check={BASIC_HTTP_CHECK} profile={profile}>
          {child ?? <ContextProbe />}
        </DashboardComparisonProvider>
      </CheckDashboardProvider>
    </MemoryRouter>
  );

  if (!navigator) {
    throw new Error('MemoryRouter navigator was not captured');
  }

  return { ...rendered, navigator };
}

function readComparison() {
  return JSON.parse(screen.getByTestId('comparison').textContent ?? '{}');
}

describe('DashboardComparisonProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appTime = {
      absolute: primary,
      timezone: 'utc',
    };
    jest.mocked(useAppTime).mockImplementation(() => appTime as ReturnType<typeof useAppTime>);
    jest.mocked(useDashboardPanelQuery).mockImplementation((_definition, options) =>
      queryResult(
        options?.range?.from === primary.from - 30 * DAY_MS
          ? samplesEndingAt(primary.from)
          : []
      )
    );
  });

  it('keeps comparison disabled without URL state while still resolving Normal health coverage', () => {
    renderProvider();

    expect(readComparison()).toMatchObject({
      enabled: false,
      referenceSpec: null,
      healthReference: {
        status: 'available',
        tierId: '24h',
        range: { from: primary.from - DAY_MS, to: primary.from },
      },
      displayReference: null,
      displayAvailability: null,
    });
  });

  it('enables at Normal and disabling clears every comparison URL key', () => {
    const { navigator } = renderProvider({
      initialEntry:
        '/checks/1?sm-v=1&sm-compare=custom&sm-compare-from=2026-07-01T00%3A00%3A00.000Z&sm-compare-to=2026-07-02T00%3A00%3A00.000Z&sm-compare-match-duration=1',
    });
    const replace = jest.spyOn(navigator, 'replace');

    fireEvent.click(screen.getByText('disable'));

    expect(screen.getByTestId('search')).not.toHaveTextContent('sm-compare');
    expect(screen.getByTestId('navigation-type')).toHaveTextContent('REPLACE');
    expect(replace).toHaveBeenLastCalledWith(
      expect.any(Object),
      undefined,
      expect.objectContaining({ replace: true })
    );
    expect(readComparison()).toMatchObject({ enabled: false, referenceSpec: null });

    fireEvent.click(screen.getByText('enable'));

    expect(screen.getByTestId('search')).toHaveTextContent('sm-compare=normal');
    expect(readComparison()).toMatchObject({ enabled: true, referenceSpec: { kind: 'normal' } });
  });

  it('re-enables at Normal instead of restoring the previous manual reference', () => {
    renderProvider({ initialEntry: '/checks/1?sm-v=1&sm-compare=shifted&sm-compare-preset=14d' });

    fireEvent.click(screen.getByText('disable'));
    fireEvent.click(screen.getByText('enable'));

    expect(readComparison().referenceSpec).toEqual({ kind: 'normal' });
    expect(screen.getByTestId('search')).toHaveTextContent('sm-compare=normal');
    expect(screen.getByTestId('search')).not.toHaveTextContent('sm-compare-preset');
  });

  it('imports legacy comparison state on a canonical dashboard and writes subsequent changes canonically', () => {
    renderProvider({
      initialEntry: '/checks/1?compare=shifted&compare.preset=14d&keep=1',
      urlFormat: 'canonical',
    });

    expect(readComparison()).toMatchObject({
      enabled: true,
      referenceSpec: { kind: 'shifted', presetId: '14d' },
    });

    fireEvent.click(screen.getByText('previous'));

    expect(screen.getByTestId('search')).toHaveTextContent('sm-compare=previous');
    expect(screen.getByTestId('search')).not.toHaveTextContent('compare=shifted');
    expect(screen.getByTestId('search')).not.toHaveTextContent('compare.preset');
    expect(screen.getByTestId('search')).toHaveTextContent('keep=1');
  });

  it('does not fall back to legacy comparison when any malformed canonical comparison key is present', () => {
    renderProvider({
      initialEntry:
        '/checks/1?sm-v=1&sm-compare=unknown&compare=shifted&compare.preset=14d',
      urlFormat: 'canonical',
    });

    expect(readComparison()).toMatchObject({
      enabled: false,
      referenceSpec: null,
    });

    fireEvent.click(screen.getByText('enable'));

    expect(screen.getByTestId('search')).toHaveTextContent('sm-compare=normal');
    expect(screen.getByTestId('search')).not.toHaveTextContent('compare=shifted');
    expect(screen.getByTestId('search')).not.toHaveTextContent('compare.preset');
  });

  it('changes the display reference without changing the coverage-selected health reference', () => {
    renderProvider({ initialEntry: '/checks/1?sm-v=1&sm-compare=normal' });
    const healthReference = readComparison().healthReference;

    fireEvent.click(screen.getByText('14d'));

    expect(readComparison().healthReference).toEqual(healthReference);
    expect(readComparison().displayReference).toMatchObject({
      status: 'valid',
      spec: { kind: 'shifted', presetId: '14d' },
      range: {
        from: primary.from - 14 * DAY_MS,
        to: primary.to - 14 * DAY_MS,
      },
    });
  });

  it('anchors Normal and Previous immediately before a historical primary range', () => {
    renderProvider({ initialEntry: '/checks/1?sm-v=1&sm-compare=normal' });

    expect(readComparison().displayReference).toMatchObject({
      status: 'valid',
      spec: { kind: 'normal' },
      range: { from: primary.from - DAY_MS, to: primary.from },
    });

    fireEvent.click(screen.getByText('previous'));

    expect(readComparison().displayReference).toMatchObject({
      status: 'valid',
      spec: { kind: 'previous' },
      range: { from: primary.from - 3 * HOUR_MS, to: primary.from },
    });
  });

  it('recomputes Previous when a derived primary range changes', () => {
    const rendered = renderProvider({ initialEntry: '/checks/1?sm-v=1&sm-compare=previous' });

    expect(readComparison().displayReference.range).toEqual({
      from: primary.from - 3 * HOUR_MS,
      to: primary.from,
    });

    appTime = {
      ...appTime,
      absolute: {
        from: primary.from - 2 * HOUR_MS,
        to: primary.to,
      },
    };
    rendered.rerender(
      <MemoryRouter initialEntries={['/checks/1?sm-v=1&sm-compare=previous']}>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
          <DashboardComparisonProvider check={BASIC_HTTP_CHECK} profile={baseProfile}>
            <ContextProbe />
          </DashboardComparisonProvider>
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    expect(readComparison().displayReference.range).toEqual({
      from: primary.from - 7 * HOUR_MS,
      to: primary.from - 2 * HOUR_MS,
    });
  });

  it('marks an overlapping custom selection invalid and leaves its query disabled', () => {
    const customFrom = new Date(primary.from - 2 * DAY_MS).toISOString();
    const customTo = new Date(primary.from - DAY_MS).toISOString();
    const rendered = renderProvider({
      initialEntry: `/checks/1?sm-v=1&sm-compare=custom&sm-compare-from=${encodeURIComponent(
        customFrom
      )}&sm-compare-to=${encodeURIComponent(customTo)}&sm-compare-match-duration=0`,
    });

    jest.mocked(useDashboardPanelQuery).mockClear();
    appTime = {
      ...appTime,
      absolute: {
        from: primary.from - 36 * HOUR_MS,
        to: primary.to,
      },
    };
    rendered.rerender(
      <MemoryRouter
        initialEntries={[
          `/checks/1?sm-v=1&sm-compare=custom&sm-compare-from=${encodeURIComponent(
            customFrom
          )}&sm-compare-to=${encodeURIComponent(customTo)}&sm-compare-match-duration=0`,
        ]}
      >
        <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
          <DashboardComparisonProvider check={BASIC_HTTP_CHECK} profile={baseProfile}>
            <ContextProbe />
          </DashboardComparisonProvider>
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    expect(readComparison()).toMatchObject({
      displayReference: { status: 'invalid', reason: 'overlaps-primary' },
      displayAvailability: { status: 'overlaps-primary' },
    });
    expect(
      jest
        .mocked(useDashboardPanelQuery)
        .mock.calls.filter(([, options]) => options?.enabled !== false)
    ).toHaveLength(1);
  });

  it('keeps an unknown preset selected and exposes its availability', () => {
    renderProvider({ initialEntry: '/checks/1?sm-v=1&sm-compare=shifted&sm-compare-preset=future' });

    expect(readComparison()).toMatchObject({
      referenceSpec: { kind: 'shifted', presetId: 'future' },
      displayReference: {
        status: 'invalid',
        spec: { kind: 'shifted', presetId: 'future' },
        reason: 'unknown-preset',
      },
      displayAvailability: { status: 'unknown-preset' },
    });
    expect(
      jest
        .mocked(useDashboardPanelQuery)
        .mock.calls.filter(([, options]) => options?.enabled !== false)
    ).toHaveLength(1);
    expect(
      jest
        .mocked(useDashboardPanelQuery)
        .mock.calls.some(([, options]) => options?.enabled === false)
    ).toBe(true);
  });

  it('classifies a partially covered manual reference', () => {
    jest.mocked(useDashboardPanelQuery).mockImplementation((_definition, options) => {
      if (options?.range?.from === primary.from - 30 * DAY_MS) {
        return queryResult(samplesEndingAt(primary.from));
      }

      return queryResult([{ at: primary.from - 2.5 * HOUR_MS, value: 2 }]);
    });

    renderProvider({ initialEntry: '/checks/1?sm-v=1&sm-compare=previous' });

    expect(readComparison().displayAvailability).toEqual({
      status: 'partial',
      coverage: 1 / 3,
      executionCount: 2,
    });
  });

  it.each([
    {
      name: 'fatal panel failure',
      result: queryResult([], { state: LoadingState.Error, zeroFrames: true }),
      expected: 'query-error',
    },
    {
      name: 'nonfatal errors alongside frames',
      result: queryResult(samplesEndingAt(primary.from), {
        errors: [{ message: 'partial datasource failure' }],
      }),
      expected: 'query-error',
    },
    {
      name: 'active query loading',
      result: queryResult(samplesEndingAt(primary.from), { isLoading: true }),
      expected: 'checking',
    },
    {
      name: 'completed zero-frame response whose panel state remains Loading',
      result: queryResult([], {
        state: LoadingState.Loading,
        isLoading: false,
        zeroFrames: true,
      }),
      expected: 'not-established',
    },
  ])('maps Normal $name to $expected', ({ result, expected }) => {
    jest.mocked(useDashboardPanelQuery).mockImplementation((_definition, options) =>
      options?.range?.from === primary.from - 30 * DAY_MS ? result : queryResult()
    );

    renderProvider();

    expect(readComparison().healthReference).toEqual({ status: expected });
  });

  it.each([
    {
      name: 'fatal panel failure',
      result: queryResult([], { state: LoadingState.Error, zeroFrames: true }),
      expected: 'query-error',
    },
    {
      name: 'nonfatal errors alongside frames',
      result: queryResult([{ at: primary.from - HOUR_MS, value: 1 }], {
        errors: [{ message: 'partial datasource failure' }],
      }),
      expected: 'query-error',
    },
    {
      name: 'active query loading',
      result: queryResult([], { isLoading: true, zeroFrames: true }),
      expected: 'checking',
    },
    {
      name: 'completed zero-frame response whose panel state remains Loading',
      result: queryResult([], {
        state: LoadingState.Loading,
        isLoading: false,
        zeroFrames: true,
      }),
      expected: 'no-retained-executions',
    },
  ])('maps manual $name to $expected', ({ result, expected }) => {
    jest.mocked(useDashboardPanelQuery).mockImplementation((_definition, options) =>
      options?.range?.from === primary.from - 30 * DAY_MS
        ? queryResult(samplesEndingAt(primary.from))
        : result
    );

    renderProvider({ initialEntry: '/checks/1?sm-v=1&sm-compare=previous' });

    expect(readComparison().displayAvailability).toEqual({ status: expected });
  });

  it('does not query a disabled candidate and queries only a valid enabled candidate range', () => {
    const reference = { kind: 'shifted', presetId: '14d' } as const;
    const rendered = renderProvider({
      child: <AvailabilityProbe enabled={false} reference={reference} />,
    });

    expect(
      jest
        .mocked(useDashboardPanelQuery)
        .mock.calls.filter(([, options]) => options?.enabled !== false)
    ).toHaveLength(1);

    jest.mocked(useDashboardPanelQuery).mockClear();
    rendered.rerender(
      <MemoryRouter initialEntries={['/checks/1']}>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
          <DashboardComparisonProvider check={BASIC_HTTP_CHECK} profile={baseProfile}>
            <AvailabilityProbe enabled reference={reference} />
          </DashboardComparisonProvider>
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    const enabledCalls = jest
      .mocked(useDashboardPanelQuery)
      .mock.calls.filter(([, options]) => options?.enabled !== false);
    expect(enabledCalls).toHaveLength(2);
    expect(enabledCalls[1][1]?.range).toEqual({
      from: primary.from - 14 * DAY_MS,
      to: primary.to - 14 * DAY_MS,
    });
  });

  it.each([
    {
      name: 'outside retention when the boundary is known',
      retainedFrom: primary.from + 1,
      status: 'outside-retention',
    },
    {
      name: 'no retained executions when the boundary is unknown',
      retainedFrom: undefined,
      status: 'no-retained-executions',
    },
  ])('reports $name', ({ retainedFrom, status }) => {
    const profile: CheckDashboardComparisonProfile<typeof BASIC_HTTP_CHECK> = {
      ...baseProfile,
      getKnownRetentionBoundary: retainedFrom === undefined ? undefined : () => retainedFrom,
    };

    renderProvider({
      initialEntry: '/checks/1?sm-v=1&sm-compare=previous',
      profile,
    });

    expect(readComparison().displayAvailability).toEqual({ status });
  });

  it('does not run presence queries when the profile capability is absent', () => {
    render(
      <MemoryRouter>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
          <DashboardComparisonProvider check={BASIC_HTTP_CHECK}>
            <ContextProbe />
          </DashboardComparisonProvider>
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    expect(useDashboardPanelQuery).not.toHaveBeenCalled();
    expect(readComparison()).toMatchObject({
      enabled: false,
      referenceSpec: null,
      healthReference: { status: 'not-established' },
    });
  });

  it('mutates legacy comparison keys with replacement navigation', () => {
    const { navigator } = renderProvider({
      initialEntry: '/checks/1?compare=shifted&compare.preset=14d&keep=1',
      urlFormat: 'legacy',
    });
    const replace = jest.spyOn(navigator, 'replace');

    fireEvent.click(screen.getByText('disable'));

    expect(screen.getByTestId('search')).toHaveTextContent('?keep=1');
    expect(screen.getByTestId('search')).not.toHaveTextContent('compare=');
    expect(screen.getByTestId('navigation-type')).toHaveTextContent('REPLACE');
    expect(replace).toHaveBeenLastCalledWith(
      expect.any(Object),
      undefined,
      expect.objectContaining({ replace: true })
    );

    fireEvent.click(screen.getByText('enable'));

    expect(screen.getByTestId('search')).toHaveTextContent('compare=normal');
    expect(screen.getByTestId('search')).not.toHaveTextContent('sm-compare');
    expect(screen.getByTestId('navigation-type')).toHaveTextContent('REPLACE');
  });

  it('leaves an unsupported canonical URL byte-for-byte unchanged and exposes a disabled context', () => {
    const initialEntry =
      '/checks/1?sm-v=999&sm-compare=previous&keep=a%20b&keep=x%2By';

    renderProvider({ initialEntry });
    const originalSearch = screen.getByTestId('search').textContent;

    expect(readComparison()).toMatchObject({
      enabled: false,
      referenceSpec: null,
      healthReference: { status: 'not-established' },
    });
    expect(useDashboardPanelQuery).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('enable'));
    fireEvent.click(screen.getByText('previous'));
    fireEvent.click(screen.getByText('disable'));

    expect(screen.getByTestId('search').textContent).toBe(originalSearch);
    expect(screen.getByTestId('navigation-type')).toHaveTextContent('POP');
    expect(useDashboardPanelQuery).not.toHaveBeenCalled();
  });
});
