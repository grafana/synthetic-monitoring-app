import { renderHook, waitFor } from '@testing-library/react';
import { spyUsePluginFunctionsForSLOs } from 'test/helpers/mockUsePluginFunctionsForSLOs';
import { createWrapper } from 'test/render';

import type { SLO } from './useSmCheckSLOs.types';

import { linkSLOToCheck, useSmCheckSLOs } from './useSmCheckSLOs';
import {
  filterSLOsByLabel,
  getMatchingSLOsForSmCheck,
  getSLOQueryStrings,
  isSLOLinkedByLabel,
  sloMatchesSmCheck,
} from './useSmCheckSLOs.utils';

const CHECK_ID = '42';
const JOB = 'my-api-check';

const baseSLO: Omit<SLO, 'uuid' | 'name' | 'query'> = {
  description: '',
  objectives: [{ value: 0.995, window: '30d' }],
};

const sloWithIdLabel: SLO = {
  ...baseSLO,
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

const sloWrongId: SLO = {
  ...baseSLO,
  uuid: 'slo-3',
  name: 'Wrong ID',
  labels: [{ key: 'sm_check_id', value: '99' }],
  query: { type: 'freeform', freeform: { query: 'up' } },
};

const sloManualRatio: SLO = {
  ...baseSLO,
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

describe('useSmCheckSLOs utils', () => {
  describe('isSLOLinkedByLabel', () => {
    it('returns false when the SLO has no sm_check_id label', () => {
      expect(isSLOLinkedByLabel(sloManualRatio, CHECK_ID)).toBe(false);
    });

    it('returns false when sm_check_id does not match the check id', () => {
      expect(isSLOLinkedByLabel(sloWrongId, CHECK_ID)).toBe(false);
    });

    it('returns true when sm_check_id matches the check id', () => {
      expect(isSLOLinkedByLabel(sloWithIdLabel, CHECK_ID)).toBe(true);
    });
  });

  describe('linkSLOToCheck', () => {
    it('calls updateSLO without readOnly and sets sm_check_id label', async () => {
      const updateSLO = jest.fn().mockResolvedValue({ data: sloWithIdLabel });
      const slo: SLO = {
        ...sloManualRatio,
        readOnly: {
          status: { type: 'created' },
          creationTimestamp: 1,
          parsesAsRatio: true,
          allowedActions: ['read', 'write'],
        },
      };

      await linkSLOToCheck(slo, CHECK_ID, updateSLO);

      expect(updateSLO).toHaveBeenCalledTimes(1);
      const payload = updateSLO.mock.calls[0][0];
      expect(payload.readOnly).toBeUndefined();
      expect(payload.labels).toEqual(
        expect.arrayContaining([{ key: 'sm_check_id', value: CHECK_ID }])
      );
    });
  });

  describe('filterSLOsByLabel', () => {
    it('returns SLOs with matching sm_check_id', () => {
      const slos: SLO[] = [sloWithIdLabel, sloWrongId, sloManualRatio];
      expect(filterSLOsByLabel(slos, CHECK_ID)).toEqual([sloWithIdLabel]);
    });

    it('does not match SLOs without the expected label', () => {
      const slos: SLO[] = [sloManualRatio, sloUnrelated];
      expect(filterSLOsByLabel(slos, CHECK_ID)).toEqual([]);
    });
  });

  describe('getSLOQueryStrings', () => {
    it('extracts ratio success and total metrics', () => {
      expect(getSLOQueryStrings(sloManualRatio)).toEqual([
        `probe_all_success_sum{job="${JOB}", instance="x"}`,
        `probe_all_success_count{job="${JOB}", instance="x"}`,
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

  describe('getMatchingSLOsForSmCheck', () => {
    it('dedupes when the same SLO would match label and query paths', () => {
      const slos: SLO[] = [sloWithIdLabel];
      expect(getMatchingSLOsForSmCheck(slos, CHECK_ID, JOB)).toEqual([sloWithIdLabel]);
    });

    it('combines label matches and query fallback without duplicates', () => {
      const slos: SLO[] = [sloWithIdLabel, sloManualRatio, sloUnrelated];
      const result = getMatchingSLOsForSmCheck(slos, CHECK_ID, JOB);
      expect(result).toHaveLength(2);
      expect(result).toContain(sloWithIdLabel);
      expect(result).toContain(sloManualRatio);
      expect(result).not.toContain(sloUnrelated);
    });
  });
});

describe('useSmCheckSLOs', () => {
  let usePluginFunctionsSpy: jest.SpyInstance | undefined;

  afterEach(() => {
    usePluginFunctionsSpy?.mockRestore();
  });

  it('fetches SLO list and returns matches for check ID and job', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([
      sloWithIdLabel,
      sloWrongId,
      sloManualRatio,
      sloUnrelated,
    ]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSmCheckSLOs(42, JOB), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeUndefined();
    expect(result.current.slos).toHaveLength(2);
    expect(result.current.slos.map((s) => s.uuid)).toEqual(expect.arrayContaining(['slo-1', 'slo-4']));
  });

  it('returns empty list when the SLO plugin function responds with 404', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSLOs([], { notFound: true });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSmCheckSLOs(42, JOB), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.slos).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });
});
