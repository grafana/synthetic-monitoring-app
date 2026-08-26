import { getMigrationCooldown, MIGRATION_COOLDOWN_MS } from './migrationCooldown';

describe('getMigrationCooldown', () => {
  const now = 1_800_000_000_000; // fixed reference point, ms

  it('is not cooling down when the tenant modified time is unknown', () => {
    expect(getMigrationCooldown(undefined, now)).toEqual({ isCoolingDown: false });
  });

  it('is cooling down when the tenant was modified less than 2 hours ago', () => {
    const modifiedSeconds = now / 1000 - 30 * 60; // 30 minutes ago
    expect(getMigrationCooldown(modifiedSeconds, now)).toEqual({
      isCoolingDown: true,
      message: 'You can change your label mode in 1 hour 30 minutes',
    });
  });

  it('is not cooling down once exactly 2 hours have elapsed', () => {
    const modifiedSeconds = now / 1000 - MIGRATION_COOLDOWN_MS / 1000;
    expect(getMigrationCooldown(modifiedSeconds, now)).toEqual({ isCoolingDown: false });
  });

  it('is not cooling down when the tenant was modified more than 2 hours ago', () => {
    const modifiedSeconds = now / 1000 - 3 * 60 * 60; // 3 hours ago
    expect(getMigrationCooldown(modifiedSeconds, now)).toEqual({ isCoolingDown: false });
  });

  it('is cooling down right after modification, with the full window remaining', () => {
    expect(getMigrationCooldown(now / 1000, now)).toEqual({
      isCoolingDown: true,
      message: 'You can change your label mode in 2 hours',
    });
  });
});
