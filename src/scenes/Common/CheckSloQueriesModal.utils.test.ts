import {
  defaultSloGroupNameForJob,
  defaultSloNameForJob,
  grafanaSloDetailDashboardHref,
  grafanaSloWizardReviewHref,
  labelsSignature,
  MAX_LABEL_VALUE_LENGTH,
  MAX_SLO_NAME,
  parseSloTargetPercent,
  sloProvenanceLabels,
  sloWindowChoiceToObjectiveWindow,
  truncateSloName,
} from './CheckSloQueriesModal.utils';

describe('defaultSloNameForJob', () => {
  it('uses job name with SLI type suffix', () => {
    expect(defaultSloNameForJob('my-check')).toBe('my-check (Reachability)');
  });

  it('truncates job that would exceed MAX_SLO_NAME', () => {
    const longJob = 'a'.repeat(MAX_SLO_NAME);
    const result = defaultSloNameForJob(longJob);
    expect(result.length).toBeLessThanOrEqual(MAX_SLO_NAME);
    expect(result).toContain('…');
    expect(result).toContain('(Reachability)');
  });
});

describe('defaultSloGroupNameForJob', () => {
  it('prefixes job with Group: and SLI type suffix', () => {
    expect(defaultSloGroupNameForJob('my-check')).toBe('Group: my-check (Reachability)');
  });

  it('truncates job that would exceed MAX_SLO_NAME', () => {
    const longJob = 'a'.repeat(MAX_SLO_NAME);
    const result = defaultSloGroupNameForJob(longJob);
    expect(result.length).toBeLessThanOrEqual(MAX_SLO_NAME);
    expect(result).toContain('…');
  });
});

describe('sloWindowChoiceToObjectiveWindow', () => {
  it('maps day choices to API window strings', () => {
    expect(sloWindowChoiceToObjectiveWindow('7')).toBe('7d');
    expect(sloWindowChoiceToObjectiveWindow('28')).toBe('28d');
  });
});

describe('grafanaSloDetailDashboardHref', () => {
  it('builds the per-SLO dashboard path', () => {
    expect(grafanaSloDetailDashboardHref(undefined, 'abc123')).toBe('/d/grafana_slo_app-abc123/');
  });

  it('prepends appSubUrl when provided', () => {
    expect(grafanaSloDetailDashboardHref('/grafana', 'uid1')).toBe('/grafana/d/grafana_slo_app-uid1/');
  });
});

describe('grafanaSloWizardReviewHref', () => {
  it('builds the wizard review path for an SLO id', () => {
    expect(grafanaSloWizardReviewHref(undefined, 'pckgdbe1wumlrohkwj8wa')).toBe(
      '/a/grafana-slo-app/wizard/review/pckgdbe1wumlrohkwj8wa'
    );
  });

  it('prepends appSubUrl when provided', () => {
    expect(grafanaSloWizardReviewHref('/grafana', 'abc')).toBe('/grafana/a/grafana-slo-app/wizard/review/abc');
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
