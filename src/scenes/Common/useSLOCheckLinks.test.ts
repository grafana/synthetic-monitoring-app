import { renderHook, waitFor } from '@testing-library/react';
import { spyUsePluginFunctionsForSLOs } from 'test/helpers/mockUsePluginFunctionsForSLOs';
import { createWrapper } from 'test/render';

import type { SLO } from './grafanaSLOApp.types';
import { useChecks } from 'data/useChecks';

import {
  sloQueryKeys,
  useAllSLOs,
  useChecksForSLO,
  useDeleteSLO,
  useSLOsForCheck,
  useUpdateSLO,
} from './useSLOCheckLinks';
import { buildSLOCheckLinkMap, getSLOQueryStrings, sloMatchesSMCheck } from './useSLOCheckLinks.utils';

const JOB = 'my-api-check';
const INSTANCE = 'https://api.example.com';

const baseSLO: Omit<SLO, 'uuid' | 'name' | 'query'> = {
  description: '',
  objectives: [{ value: 0.995, window: '30d' }],
};

const sloWizardRatio: SLO = {
  ...baseSLO,
  uuid: 'slo-1',
  name: 'Wizard SLO',
  query: {
    type: 'ratio',
    ratio: {
      successMetric: { prometheusMetric: `probe_all_success_sum{job="${JOB}", instance="https://api.example.com"}` },
      totalMetric: { prometheusMetric: `probe_all_success_count{job="${JOB}", instance="https://api.example.com"}` },
    },
  },
};

const sloManualRatio: SLO = {
  ...baseSLO,
  uuid: 'slo-4',
  name: 'Manual ratio',
  query: {
    type: 'ratio',
    ratio: {
      successMetric: { prometheusMetric: `probe_all_success_sum{job="${JOB}", instance="${INSTANCE}"}` },
      totalMetric: { prometheusMetric: `probe_all_success_count{job="${JOB}", instance="${INSTANCE}"}` },
    },
  },
};

const sloManualFreeform: SLO = {
  ...baseSLO,
  uuid: 'slo-5',
  name: 'Manual freeform',
  query: {
    type: 'freeform',
    freeform: {
      query: `sum(sum_over_time(probe_success{job="${JOB}", instance="https://api.example.com"}[$__interval]))`,
    },
  },
};

const sloUnrelated: SLO = {
  ...baseSLO,
  uuid: 'slo-6',
  name: 'Unrelated',
  query: {
    type: 'freeform',
    freeform: { query: `http_requests_total{job="${JOB}"}` },
  },
};

const sloGrafanaQueries: SLO = {
  ...baseSLO,
  uuid: 'slo-7',
  name: 'Grafana queries',
  query: {
    type: 'grafanaQueries',
    grafanaQueries: {
      grafanaQueries: [{ expr: `probe_success{job="${JOB}"}` }, { expr: 'vector(1)' }],
    },
  },
};

const sloWrongInstance: SLO = {
  ...baseSLO,
  uuid: 'slo-8',
  name: 'Wrong instance',
  query: {
    type: 'ratio',
    ratio: {
      successMetric: { prometheusMetric: `probe_all_success_sum{job="${JOB}", instance="https://wrong.example.com"}` },
      totalMetric: {
        prometheusMetric: `probe_all_success_count{job="${JOB}", instance="https://wrong.example.com"}`,
      },
    },
  },
};

const sloJobOnly: SLO = {
  ...baseSLO,
  uuid: 'slo-9',
  name: 'Job only',
  query: {
    type: 'ratio',
    ratio: {
      successMetric: { prometheusMetric: `probe_all_success_sum{job="${JOB}"}` },
      totalMetric: { prometheusMetric: `probe_all_success_count{job="${JOB}"}` },
    },
  },
};

const sloHttpMetric: SLO = {
  ...baseSLO,
  uuid: 'slo-10',
  name: 'HTTP metric',
  query: {
    type: 'freeform',
    freeform: {
      query: `sm_http_request_duration_seconds{job="${JOB}", instance="${INSTANCE}"}`,
    },
  },
};

describe('useSLOCheckLinks utils', () => {
  describe('getSLOQueryStrings', () => {
    it('extracts ratio success and total metrics', () => {
      expect(getSLOQueryStrings(sloManualRatio)).toEqual([
        `probe_all_success_sum{job="${JOB}", instance="${INSTANCE}"}`,
        `probe_all_success_count{job="${JOB}", instance="${INSTANCE}"}`,
      ]);
    });

    it('extracts freeform query', () => {
      expect(getSLOQueryStrings(sloManualFreeform)).toEqual([
        `sum(sum_over_time(probe_success{job="${JOB}", instance="https://api.example.com"}[$__interval]))`,
      ]);
    });

    it('extracts grafanaQueries expr fields', () => {
      expect(getSLOQueryStrings(sloGrafanaQueries)).toEqual([`probe_success{job="${JOB}"}`, 'vector(1)']);
    });
  });

  describe('sloMatchesSMCheck', () => {
    it('matches ratio SLO with reachability metrics and job and instance labels', () => {
      expect(sloMatchesSMCheck(sloManualRatio, JOB, INSTANCE)).toBe(true);
    });

    it('does not match freeform SLO with probe_success only', () => {
      expect(sloMatchesSMCheck(sloManualFreeform, JOB, INSTANCE)).toBe(false);
    });

    it('does not match grafanaQueries SLO with probe_success only', () => {
      expect(sloMatchesSMCheck(sloGrafanaQueries, JOB, INSTANCE)).toBe(false);
    });

    it('does not match unrelated metrics even with job label', () => {
      expect(sloMatchesSMCheck(sloUnrelated, JOB, INSTANCE)).toBe(false);
    });

    it('does not match when job matches but instance does not', () => {
      expect(sloMatchesSMCheck(sloWrongInstance, JOB, INSTANCE)).toBe(false);
    });

    it('does not match when instance label is absent from the query', () => {
      expect(sloMatchesSMCheck(sloJobOnly, JOB, INSTANCE)).toBe(false);
    });

    it('does not match sm_http metrics even with matching job and instance', () => {
      expect(sloMatchesSMCheck(sloHttpMetric, JOB, INSTANCE)).toBe(false);
    });
  });
});

describe('buildSLOCheckLinkMap', () => {
  const makeCheck = (id: number, job: string, target: string) =>
    ({
      id,
      job,
      target,
      frequency: 60000,
      timeout: 3000,
      enabled: true,
      alertSensitivity: 'none',
      basicMetricsOnly: false,
      labels: [],
      probes: [1],
      settings: { http: {} },
    }) as any;

  const checkA = makeCheck(1, JOB, 'https://api.example.com');
  const checkB = makeCheck(2, JOB, 'https://other.example.com');
  const checkC = makeCheck(3, 'different-job', 'https://different.example.com');

  it('returns empty maps when no slos and no checks', () => {
    const map = buildSLOCheckLinkMap([], []);
    expect(map.slosByCheckId.size).toBe(0);
    expect(map.checksBySLOUuid.size).toBe(0);
  });

  it('links an SLO that matches a single check by job and instance', () => {
    const map = buildSLOCheckLinkMap([sloManualRatio], [checkA, checkC]);
    expect(map.slosByCheckId.get(1)).toEqual([sloManualRatio]);
    expect(map.slosByCheckId.has(3)).toBe(false);
  });

  it('does not link one SLO to multiple checks that share the same job but differ on instance', () => {
    const map = buildSLOCheckLinkMap([sloManualRatio], [checkA, checkB]);
    expect(map.slosByCheckId.get(1)).toEqual([sloManualRatio]);
    expect(map.slosByCheckId.has(2)).toBe(false);
  });

  it('links a single reachability SLO to one check', () => {
    const map = buildSLOCheckLinkMap([sloManualRatio], [checkA]);
    expect(map.slosByCheckId.get(1)).toEqual([sloManualRatio]);
  });

  it('ignores SLOs whose metric is not an SM metric', () => {
    const map = buildSLOCheckLinkMap([sloUnrelated], [checkA]);
    expect(map.slosByCheckId.has(1)).toBe(false);
    expect(map.checksBySLOUuid.has(sloUnrelated.uuid)).toBe(false);
  });

  it('ignores SLOs whose readOnly.status.type is "deleting"', () => {
    const deletingSLO: SLO = {
      ...sloManualRatio,
      uuid: 'deleting-slo',
      readOnly: { status: { type: 'deleting' }, creationTimestamp: 0 },
    };
    const map = buildSLOCheckLinkMap([deletingSLO], [checkA]);
    expect(map.slosByCheckId.has(1)).toBe(false);
    expect(map.checksBySLOUuid.has('deleting-slo')).toBe(false);
  });

  it('populates both directions of the map symmetrically', () => {
    const map = buildSLOCheckLinkMap([sloManualRatio], [checkA, checkB, checkC]);
    expect(map.slosByCheckId.get(1)).toEqual([sloManualRatio]);
    expect(map.slosByCheckId.has(2)).toBe(false);
    expect(map.slosByCheckId.has(3)).toBe(false);

    expect(map.checksBySLOUuid.get(sloManualRatio.uuid)).toEqual([checkA]);
  });
});

describe('useAllSLOs', () => {
  let usePluginFunctionsSpy: jest.SpyInstance | undefined;

  afterEach(() => {
    usePluginFunctionsSpy?.mockRestore();
  });

  it('returns the full SLO list when the plugin function resolves', async () => {
    const allSLOs = [sloWizardRatio, sloManualRatio, sloUnrelated];
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs(allSLOs);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAllSLOs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeUndefined();
    expect(result.current.slos).toHaveLength(3);
    expect(result.current.slos).toEqual(allSLOs);
  });

  it('returns empty when the plugin function returns 404', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([], { notFound: true });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAllSLOs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.slos).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it('returns empty (not loading) when the SLO plugin is not installed', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([]);
    const { Wrapper } = createWrapper({
      externalDependenciesOverrides: { slo: { installed: false, isLoading: false } },
    });
    const { result } = renderHook(() => useAllSLOs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.slos).toEqual([]);
  });

  it('uses a single global query key', () => {
    expect(sloQueryKeys.all).toEqual(['slos']);
  });
});

jest.mock('data/useChecks');
const mockUseChecks = useChecks as jest.MockedFunction<typeof useChecks>;

const makeCheck = (id: number, job: string, target: string) =>
  ({
    id,
    job,
    target,
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    alertSensitivity: 'none',
    basicMetricsOnly: false,
    labels: [],
    probes: [1],
    settings: { http: {} },
  }) as any;

describe('useSLOsForCheck', () => {
  let usePluginFunctionsSpy: jest.SpyInstance | undefined;

  afterEach(() => {
    usePluginFunctionsSpy?.mockRestore();
    mockUseChecks.mockReset();
  });

  it('returns the slos linked to the given check id', async () => {
    const checkA = makeCheck(1, JOB, 'https://api.example.com');
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([sloManualRatio]);
    mockUseChecks.mockReturnValue({
      data: [checkA],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useChecks>);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSLOsForCheck(1), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.slos).toEqual([sloManualRatio]);
  });

  it('returns an empty array for an unknown check id', async () => {
    const checkA = makeCheck(1, JOB, 'https://api.example.com');
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([sloManualRatio]);
    mockUseChecks.mockReturnValue({
      data: [checkA],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useChecks>);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSLOsForCheck(999), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.slos).toEqual([]);
  });

  it('returns an empty array when check id is undefined', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([sloManualRatio]);
    mockUseChecks.mockReturnValue({
      data: [makeCheck(1, JOB, 'https://api.example.com')],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useChecks>);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSLOsForCheck(undefined), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.slos).toEqual([]);
  });
});

describe('useChecksForSLO', () => {
  let usePluginFunctionsSpy: jest.SpyInstance | undefined;

  afterEach(() => {
    usePluginFunctionsSpy?.mockRestore();
    mockUseChecks.mockReset();
  });

  it('returns the checks covered by the given slo uuid', async () => {
    const checkA = makeCheck(1, JOB, 'https://api.example.com');
    const checkB = makeCheck(2, 'different-job', 'https://different.example.com');
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([sloManualRatio]);
    mockUseChecks.mockReturnValue({
      data: [checkA, checkB],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useChecks>);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useChecksForSLO(sloManualRatio.uuid), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.checks).toEqual([checkA]);
  });

  it('returns an empty array for an unknown slo uuid', async () => {
    const checkA = makeCheck(1, JOB, 'https://api.example.com');
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([sloManualRatio]);
    mockUseChecks.mockReturnValue({
      data: [checkA],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useChecks>);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useChecksForSLO('nonexistent-uuid'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.checks).toEqual([]);
  });
});

describe('useUpdateSLO', () => {
  let usePluginFunctionsSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    mockUseChecks.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useChecks>);
  });

  afterEach(() => {
    usePluginFunctionsSpy?.mockRestore();
    mockUseChecks.mockReset();
  });

  it('calls the plugin api updateSlo and returns no error', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([sloManualRatio]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateSLO(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(typeof result.current).toBe('function');
    });

    const updateResult = await result.current(sloManualRatio);
    expect(updateResult.error).toBeUndefined();
  });

  it('returns the rejection as an error rather than throwing', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([sloManualRatio]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateSLO(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(typeof result.current).toBe('function');
    });

    const api = await usePluginFunctionsSpy.mock.results[0].value.functions[0].fn();
    api.updateSlo.mockRejectedValueOnce({ status: 500, message: 'Boom' });

    const updateResult = await result.current(sloManualRatio);
    expect(updateResult.error?.message).toBe('Boom');
  });
});

describe('useDeleteSLO', () => {
  let usePluginFunctionsSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    mockUseChecks.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useChecks>);
  });

  afterEach(() => {
    usePluginFunctionsSpy?.mockRestore();
    mockUseChecks.mockReset();
  });

  it('calls the plugin api deleteSlo with the uuid', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([sloManualRatio]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteSLO(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(typeof result.current).toBe('function');
    });

    const deleteResult = await result.current('slo-4');
    expect(deleteResult.data).toEqual({ uuid: 'slo-4' });
    expect(deleteResult.error).toBeUndefined();
  });
});
