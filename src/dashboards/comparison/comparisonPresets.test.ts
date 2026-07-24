import { COMPARISON_PRESETS } from './comparisonPresets';

describe('COMPARISON_PRESETS', () => {
  it('keeps the stable preset order', () => {
    expect(COMPARISON_PRESETS.map(({ id }) => id)).toEqual(['24h', '7d', '14d', '21d', '30d', '3m', '1y']);
  });

  it('clamps a three-month shift from 31 May to the last valid February date', () => {
    const primary = {
      from: Date.parse('2026-05-31T08:00:00.000Z'),
      to: Date.parse('2026-05-31T11:00:00.000Z'),
    };

    expect(COMPARISON_PRESETS.find((preset) => preset.id === '3m')?.resolve(primary, 'utc')).toEqual({
      from: Date.parse('2026-02-28T08:00:00.000Z'),
      to: Date.parse('2026-02-28T11:00:00.000Z'),
    });
  });

  it('clamps a one-year shift from leap day to 28 February', () => {
    const primary = {
      from: Date.parse('2024-02-29T08:00:00.000Z'),
      to: Date.parse('2024-02-29T11:00:00.000Z'),
    };

    expect(COMPARISON_PRESETS.find((preset) => preset.id === '1y')?.resolve(primary, 'utc')).toEqual({
      from: Date.parse('2023-02-28T08:00:00.000Z'),
      to: Date.parse('2023-02-28T11:00:00.000Z'),
    });
  });

  it('preserves three elapsed hours when a London calendar shift crosses DST', () => {
    const primary = {
      from: Date.parse('2026-06-29T00:00:00.000Z'),
      to: Date.parse('2026-06-29T03:00:00.000Z'),
    };
    const range = COMPARISON_PRESETS.find((preset) => preset.id === '3m')?.resolve(primary, 'Europe/London');

    expect(range?.from).toBe(Date.parse('2026-03-29T01:00:00.000Z'));
    expect(range && range.to - range.from).toBe(3 * 60 * 60 * 1000);
  });

  it.each(COMPARISON_PRESETS)('preserves elapsed duration for $id', (preset) => {
    const primary = {
      from: Date.parse('2026-07-09T08:00:00.000Z'),
      to: Date.parse('2026-07-09T11:00:00.000Z'),
    };
    const range = preset.resolve(primary, 'Europe/London');

    expect(range.to - range.from).toBe(primary.to - primary.from);
  });
});
