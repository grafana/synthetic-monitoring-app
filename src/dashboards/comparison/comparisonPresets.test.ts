import {
  BASELINE_COMPARISON_PRESETS,
  SAME_PERIOD_COMPARISON_PRESETS,
} from './comparisonPresets';

describe('comparison presets', () => {
  it('keeps normal baselines separate from same-period comparisons', () => {
    expect(BASELINE_COMPARISON_PRESETS.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: '30d', label: 'Last 30 days' },
      { id: '21d', label: 'Last 21 days' },
      { id: '14d', label: 'Last 14 days' },
      { id: '7d', label: 'Last 7 days' },
      { id: '24h', label: 'Last 24 hours' },
    ]);
    expect(SAME_PERIOD_COMPARISON_PRESETS.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: '24h', label: 'Same period yesterday' },
      { id: '7d', label: 'Same period last week' },
      { id: '1m', label: 'Same period last month' },
    ]);
  });

  it('resolves a baseline to the full lookback immediately before the selected range', () => {
    const primary = {
      from: Date.parse('2026-07-09T08:00:00.000Z'),
      to: Date.parse('2026-07-09T11:00:00.000Z'),
    };

    expect(BASELINE_COMPARISON_PRESETS.find((preset) => preset.id === '14d')?.resolve(primary, 'utc')).toEqual({
      from: Date.parse('2026-06-25T08:00:00.000Z'),
      to: Date.parse('2026-07-09T08:00:00.000Z'),
    });
  });

  it('clamps a last-month shift from 31 May to the last valid April date', () => {
    const primary = {
      from: Date.parse('2026-05-31T08:00:00.000Z'),
      to: Date.parse('2026-05-31T11:00:00.000Z'),
    };

    expect(SAME_PERIOD_COMPARISON_PRESETS.find((preset) => preset.id === '1m')?.resolve(primary, 'utc')).toEqual({
      from: Date.parse('2026-04-30T08:00:00.000Z'),
      to: Date.parse('2026-04-30T11:00:00.000Z'),
    });
  });

  it('preserves three elapsed hours when a London last-month shift crosses DST', () => {
    const primary = {
      from: Date.parse('2026-04-29T00:00:00.000Z'),
      to: Date.parse('2026-04-29T03:00:00.000Z'),
    };
    const range = SAME_PERIOD_COMPARISON_PRESETS.find((preset) => preset.id === '1m')?.resolve(
      primary,
      'Europe/London'
    );

    expect(range?.from).toBe(Date.parse('2026-03-29T01:00:00.000Z'));
    expect(range && range.to - range.from).toBe(3 * 60 * 60 * 1000);
  });

  it.each(SAME_PERIOD_COMPARISON_PRESETS)('preserves elapsed duration for same-period $id', (preset) => {
    const primary = {
      from: Date.parse('2026-07-09T08:00:00.000Z'),
      to: Date.parse('2026-07-09T11:00:00.000Z'),
    };
    const range = preset.resolve(primary, 'Europe/London');

    expect(range.to - range.from).toBe(primary.to - primary.from);
  });
});
