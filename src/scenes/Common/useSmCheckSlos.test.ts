import { renderHook, waitFor } from '@testing-library/react';
import { spyUsePluginFunctionsForSlos } from 'test/helpers/mockUsePluginFunctionsForSlos';
import { createWrapper } from 'test/render';

import type { Slo } from './useSmCheckSlos.types';

import { useSmCheckSlos } from './useSmCheckSlos';
import {
  filterSlosByLabel,
  getMatchingSlosForSmCheck,
  getSloQueryStrings,
  sloMatchesSmCheck,
} from './useSmCheckSlos.utils';

const CHECK_ID = '42';
const JOB = 'my-api-check';

const baseSlo: Omit<Slo, 'uuid' | 'name' | 'query'> = {
  description: '',
  objectives: [{ value: 0.995, window: '30d' }],
};

const sloWithIdLabel: Slo = {
  ...baseSlo,
  uuid: 'slo-1',
  name: 'Wizard SLO',
  labels: [{ key: 'sm_check_id', value: CHECK_ID }],
  query: {
    type: 'ratio',
    ratio: {
      successMetric: { prometheusMetric: `probe_all_success_sum{job="${JOB}", instance="https://api.example.com"}` },
      totalMetric: { prometheusMetric: `probe_all_success_count{job="${JOB}", instance="https://api.example.com"}` },
    },
  },
};

const sloWrongId: Slo = {
  ...baseSlo,
  uuid: 'slo-3',
  name: 'Wrong ID',
  labels: [{ key: 'sm_check_id', value: '99' }],
  query: { type: 'freeform', freeform: { query: 'up' } },
};

const sloManualRatio: Slo = {
  ...baseSlo,
  uuid: 'slo-4',
  name: 'Manual ratio',
  query: {
    type: 'ratio',
    ratio: {
      successMetric: { prometheusMetric: `probe_all_success_sum{job="${JOB}", instance="x"}` },
      totalMetric: { prometheusMetric: `probe_all_success_count{job="${JOB}", instance="x"}` },
    },
  },
};

const sloManualFreeform: Slo = {
  ...baseSlo,
  uuid: 'slo-5',
  name: 'Manual freeform',
  query: {
    type: 'freeform',
    freeform: {
      query: `sum(sum_over_time(probe_success{job="${JOB}", instance="https://api.example.com"}[$__interval]))`,
    },
  },
};

const sloUnrelated: Slo = {
  ...baseSlo,
  uuid: 'slo-6',
  name: 'Unrelated',
  query: {
    type: 'freeform',
    freeform: { query: `http_requests_total{job="${JOB}"}` },
  },
};

const sloGrafanaQueries: Slo = {
  ...baseSlo,
  uuid: 'slo-7',
  name: 'Grafana queries',
  query: {
    type: 'grafanaQueries',
    grafanaQueries: {
      grafanaQueries: [{ expr: `probe_success{job="${JOB}"}` }, { expr: 'vector(1)' }],
    },
  },
};

describe('useSmCheckSlos utils', () => {
  describe('filterSlosByLabel', () => {
    it('returns SLOs with matching sm_check_id', () => {
      const slos: Slo[] = [sloWithIdLabel, sloWrongId, sloManualRatio];
      expect(filterSlosByLabel(slos, CHECK_ID)).toEqual([sloWithIdLabel]);
    });

    it('does not match SLOs without the expected label', () => {
      const slos: Slo[] = [sloManualRatio, sloUnrelated];
      expect(filterSlosByLabel(slos, CHECK_ID)).toEqual([]);
    });
  });

  describe('getSloQueryStrings', () => {
    it('extracts ratio success and total metrics', () => {
      expect(getSloQueryStrings(sloManualRatio)).toEqual([
        `probe_all_success_sum{job="${JOB}", instance="x"}`,
        `probe_all_success_count{job="${JOB}", instance="x"}`,
      ]);
    });

    it('extracts freeform query', () => {
      expect(getSloQueryStrings(sloManualFreeform)).toEqual([
        `sum(sum_over_time(probe_success{job="${JOB}", instance="https://api.example.com"}[$__interval]))`,
      ]);
    });

    it('extracts grafanaQueries expr fields', () => {
      expect(getSloQueryStrings(sloGrafanaQueries)).toEqual([`probe_success{job="${JOB}"}`, 'vector(1)']);
    });
  });

  describe('sloMatchesSmCheck', () => {
    it('matches ratio SLO with SM metric and job label', () => {
      expect(sloMatchesSmCheck(sloManualRatio, JOB)).toBe(true);
    });

    it('matches freeform SLO with probe_success and job', () => {
      expect(sloMatchesSmCheck(sloManualFreeform, JOB)).toBe(true);
    });

    it('does not match unrelated metrics even with job label', () => {
      expect(sloMatchesSmCheck(sloUnrelated, JOB)).toBe(false);
    });
  });

  describe('getMatchingSlosForSmCheck', () => {
    it('dedupes when the same SLO would match label and query paths', () => {
      const slos: Slo[] = [sloWithIdLabel];
      expect(getMatchingSlosForSmCheck(slos, CHECK_ID, JOB)).toEqual([sloWithIdLabel]);
    });

    it('combines label matches and query fallback without duplicates', () => {
      const slos: Slo[] = [sloWithIdLabel, sloManualRatio, sloUnrelated];
      const result = getMatchingSlosForSmCheck(slos, CHECK_ID, JOB);
      expect(result).toHaveLength(2);
      expect(result).toContain(sloWithIdLabel);
      expect(result).toContain(sloManualRatio);
      expect(result).not.toContain(sloUnrelated);
    });
  });
});

describe('useSmCheckSlos', () => {
  let usePluginFunctionsSpy: jest.SpyInstance | undefined;

  afterEach(() => {
    usePluginFunctionsSpy?.mockRestore();
  });

  it('fetches SLO list and returns matches for check ID and job', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSlos([
      sloWithIdLabel,
      sloWrongId,
      sloManualRatio,
      sloUnrelated,
    ]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSmCheckSlos(42, JOB), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeUndefined();
    expect(result.current.slos).toHaveLength(2);
    expect(result.current.slos.map((s) => s.uuid)).toEqual(expect.arrayContaining(['slo-1', 'slo-4']));
  });

  it('returns empty list when the SLO plugin function responds with 404', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSlos([], { notFound: true });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSmCheckSlos(42, JOB), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.slos).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });
});
