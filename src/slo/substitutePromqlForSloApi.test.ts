import { substitutePromqlRateWindowForSloApi } from './substitutePromqlForSloApi';

describe('substitutePromqlRateWindowForSloApi', () => {
  it('replaces $__rate_interval range with 5m for SLO API', () => {
    expect(substitutePromqlRateWindowForSloApi('rate(foo[$__rate_interval])')).toBe('rate(foo[5m])');
  });
});
