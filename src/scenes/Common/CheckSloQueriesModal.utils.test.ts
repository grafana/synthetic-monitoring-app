import {
  defaultSloGroupNameForJob,
  defaultSloNameForJob,
  grafanaSloDetailDashboardHref,
  labelsSignature,
  MAX_LABEL_VALUE_LENGTH,
  MAX_SLO_NAME,
  parseSloTargetPercent,
  parseSloWindowDays,
  sloProvenanceLabels,
  truncateSloName,
} from './CheckSloQueriesModal.utils';

describe('defaultSloNameForJob', () => {
  it('prefixes job with "SLO: "', () => {
    expect(defaultSloNameForJob('my-check')).toBe('SLO: my-check');
  });

  it('truncates job that would exceed MAX_SLO_NAME', () => {
    const longJob = 'a'.repeat(MAX_SLO_NAME);
    const result = defaultSloNameForJob(longJob);
    expect(result.length).toBeLessThanOrEqual(MAX_SLO_NAME);
    expect(result).toContain('…');
  });
});

describe('defaultSloGroupNameForJob', () => {
  it('prefixes job with "SLO Group: "', () => {
    expect(defaultSloGroupNameForJob('my-check')).toBe('SLO Group: my-check');
  });

  it('truncates job that would exceed MAX_SLO_NAME', () => {
    const longJob = 'a'.repeat(MAX_SLO_NAME);
    const result = defaultSloGroupNameForJob(longJob);
    expect(result.length).toBeLessThanOrEqual(MAX_SLO_NAME);
    expect(result).toContain('…');
  });
});

describe('grafanaSloDetailDashboardHref', () => {
  it('builds a dashboard path from the SLO uuid', () => {
    expect(grafanaSloDetailDashboardHref('abc-123')).toBe('/d/grafana_slo_app-abc-123/');
  });

  it('prepends appSubUrl when provided', () => {
    expect(grafanaSloDetailDashboardHref('abc-123', '/grafana')).toBe('/grafana/d/grafana_slo_app-abc-123/');
  });

  it('handles undefined appSubUrl', () => {
    expect(grafanaSloDetailDashboardHref('abc-123', undefined)).toBe('/d/grafana_slo_app-abc-123/');
  });
});

describe('parseSloTargetPercent', () => {
  it('parses a valid percentage to a fraction', () => {
    const result = parseSloTargetPercent('99.5');
    expect(result).toEqual({ ok: true, fraction: 0.995 });
  });

  it('strips commas and percent signs', () => {
    const result = parseSloTargetPercent('99.5%');
    expect(result).toEqual({ ok: true, fraction: 0.995 });
  });

  it('trims whitespace', () => {
    const result = parseSloTargetPercent('  99.9  ');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fraction).toBeCloseTo(0.999);
    }
  });

  it('rejects zero', () => {
    const result = parseSloTargetPercent('0');
    expect(result.ok).toBe(false);
  });

  it('rejects 100', () => {
    const result = parseSloTargetPercent('100');
    expect(result.ok).toBe(false);
  });

  it('rejects non-numeric input', () => {
    const result = parseSloTargetPercent('abc');
    expect(result.ok).toBe(false);
  });

  it('rejects negative values', () => {
    const result = parseSloTargetPercent('-5');
    expect(result.ok).toBe(false);
  });
});

describe('parseSloWindowDays', () => {
  it('parses a valid day count', () => {
    expect(parseSloWindowDays('28')).toEqual({ ok: true, window: '28d' });
  });

  it('parses the minimum (1 day)', () => {
    expect(parseSloWindowDays('1')).toEqual({ ok: true, window: '1d' });
  });

  it('parses the maximum (3650 days)', () => {
    expect(parseSloWindowDays('3650')).toEqual({ ok: true, window: '3650d' });
  });

  it('rejects zero', () => {
    expect(parseSloWindowDays('0').ok).toBe(false);
  });

  it('rejects negative values', () => {
    expect(parseSloWindowDays('-5').ok).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(parseSloWindowDays('abc').ok).toBe(false);
  });

  it('rejects values above 3650', () => {
    expect(parseSloWindowDays('3651').ok).toBe(false);
  });
});

describe('labelsSignature', () => {
  it('produces a stable string from labels', () => {
    const labels = [
      { name: 'team', value: 'backend' },
      { name: 'env', value: 'prod' },
    ];
    expect(labelsSignature(labels)).toBe('team\0backend\nenv\0prod');
  });

  it('returns empty string for empty labels', () => {
    expect(labelsSignature([])).toBe('');
  });
});

describe('truncateSloName', () => {
  it('returns trimmed name when within limit', () => {
    expect(truncateSloName('  My SLO  ', 'fallback')).toBe('My SLO');
  });

  it('uses fallback when name is empty', () => {
    expect(truncateSloName('', 'fallback')).toBe('fallback');
  });

  it('uses fallback when name is whitespace-only', () => {
    expect(truncateSloName('   ', 'fallback')).toBe('fallback');
  });

  it('truncates names exceeding MAX_SLO_NAME', () => {
    const longName = 'x'.repeat(MAX_SLO_NAME + 10);
    const result = truncateSloName(longName, 'fallback');
    expect(result.length).toBeLessThanOrEqual(MAX_SLO_NAME);
    expect(result).toContain('…');
  });
});

describe('sloProvenanceLabels', () => {
  it('includes source and check metadata', () => {
    const check = { id: 42, job: 'my-check', labels: [] } as any;
    const labels = sloProvenanceLabels(check);

    expect(labels).toEqual(
      expect.arrayContaining([
        { key: 'source', value: 'grafana-synthetic-monitoring-app' },
        { key: 'sm_check_id', value: '42' },
        { key: 'sm_check_job', value: 'my-check' },
      ])
    );
  });

  it('truncates job values exceeding MAX_LABEL_VALUE_LENGTH', () => {
    const longJob = 'a'.repeat(MAX_LABEL_VALUE_LENGTH + 50);
    const check = { id: 1, job: longJob, labels: [] } as any;
    const labels = sloProvenanceLabels(check);

    const jobLabel = labels.find((l) => l.key === 'sm_check_job');
    expect(jobLabel).toBeDefined();
    expect(jobLabel!.value.length).toBeLessThanOrEqual(MAX_LABEL_VALUE_LENGTH);
    expect(jobLabel!.value.length).toBeLessThan(longJob.length);
  });

  it('omits sm_check_id when check.id is null', () => {
    const check = { id: null, job: 'j', labels: [] } as any;
    const labels = sloProvenanceLabels(check);

    expect(labels.find((l) => l.key === 'sm_check_id')).toBeUndefined();
  });
});
