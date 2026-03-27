import { isK6VersionUnknown, UNKNOWN_K6_VERSION } from './CheckProbes.utils';

describe('isK6VersionUnknown', () => {
  it('should return true for the unknown version string', () => {
    expect(isK6VersionUnknown(UNKNOWN_K6_VERSION)).toBe(true);
    expect(isK6VersionUnknown('unknown')).toBe(true);
  });

  it('should return false for a valid semver version', () => {
    expect(isK6VersionUnknown('1.2.3')).toBe(false);
    expect(isK6VersionUnknown('0.48.0')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isK6VersionUnknown(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isK6VersionUnknown(undefined)).toBe(false);
  });
});
