import {
  getActiveDashboardScope,
  registerActiveDashboardScope,
} from './dashboardQueryInvalidation';
import { createDashboardQueryScope } from './dashboardQueryKeys';

describe('active dashboard query scope registration', () => {
  it('keeps a scope active while another panel hook remains registered', () => {
    const scope = createDashboardQueryScope('stack-a', 7);
    const unregisterHeaderMetric = registerActiveDashboardScope(scope);
    const unregisterMenuMetric = registerActiveDashboardScope(scope);

    unregisterMenuMetric();

    expect(getActiveDashboardScope()).toEqual(scope);

    unregisterHeaderMetric();
    expect(getActiveDashboardScope()).toBeNull();
  });

  it('does not clear a newer registration when hooks unregister out of order', () => {
    const scope = createDashboardQueryScope('stack-a', 7);
    const unregisterFirst = registerActiveDashboardScope(scope);
    const unregisterSecond = registerActiveDashboardScope(scope);

    unregisterFirst();

    expect(getActiveDashboardScope()).toEqual(scope);

    unregisterSecond();
    expect(getActiveDashboardScope()).toBeNull();
  });

  it('falls back to the prior dashboard scope when the latest registration unmounts', () => {
    const firstScope = createDashboardQueryScope('stack-a', 7);
    const secondScope = createDashboardQueryScope('stack-b', 8);
    const unregisterFirst = registerActiveDashboardScope(firstScope);
    const unregisterSecond = registerActiveDashboardScope(secondScope);

    expect(getActiveDashboardScope()).toEqual(secondScope);

    unregisterSecond();
    expect(getActiveDashboardScope()).toEqual(firstScope);

    unregisterFirst();
    expect(getActiveDashboardScope()).toBeNull();
  });
});
