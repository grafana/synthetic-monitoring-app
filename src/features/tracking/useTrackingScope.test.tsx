import { renderHook } from '@testing-library/react';
import { getGlobalTrackingProps } from 'features/tracking/globalTrackingProps';
import { useTrackingScope } from 'features/tracking/useTrackingScope';
import { createSMEventFactory, setTrackingBaseProps, TrackingEventProps } from 'features/tracking/utils';

jest.mock('features/tracking/globalTrackingProps');

interface ScopedSampleEvent extends TrackingEventProps {
  /** The type of check, to exercise event-prop precedence over scope props in tests. */
  check_type: string;
}

const trackScopeProbeEvent = createSMEventFactory('test_feature')('scope_probe');
const trackTypedScopeProbeEvent = createSMEventFactory('test_feature')<ScopedSampleEvent>('typed_scope_probe');

describe('useTrackingScope', () => {
  const reportInteraction = jest.fn();

  beforeAll(() => {
    // the factory resolves reportInteraction from the mocked module object at call time,
    // so replacing the property intercepts it
    jest.requireMock('@grafana/runtime').reportInteraction = reportInteraction;
  });

  beforeEach(() => {
    setTrackingBaseProps({});
    jest.mocked(getGlobalTrackingProps).mockReturnValue({});
    reportInteraction.mockClear();
  });

  function getLastReportedProps() {
    return reportInteraction.mock.calls[reportInteraction.mock.calls.length - 1][1];
  }

  it('attaches scope props to events fired while mounted', () => {
    renderHook(() => useTrackingScope({ check_type: 'http' }));

    trackScopeProbeEvent();

    expect(getLastReportedProps()).toEqual({ check_type: 'http' });
  });

  it('keeps scope props current across re-renders', () => {
    const { rerender } = renderHook(({ checkType }) => useTrackingScope({ check_type: checkType }), {
      initialProps: { checkType: 'http' },
    });

    rerender({ checkType: 'browser' });
    trackScopeProbeEvent();

    expect(getLastReportedProps()).toEqual({ check_type: 'browser' });
  });

  it('removes scope props when the component unmounts', () => {
    const { unmount } = renderHook(() => useTrackingScope({ check_type: 'http' }));

    unmount();
    trackScopeProbeEvent();

    expect(getLastReportedProps()).toEqual({});
  });

  it('merges props from concurrently mounted scopes', () => {
    const checkScope = renderHook(() => useTrackingScope({ check_type: 'http' }));
    renderHook(() => useTrackingScope({ time_range_from: 'now-3h' }));

    trackScopeProbeEvent();
    expect(getLastReportedProps()).toEqual({ check_type: 'http', time_range_from: 'now-3h' });

    checkScope.unmount();
    trackScopeProbeEvent();
    expect(getLastReportedProps()).toEqual({ time_range_from: 'now-3h' });
  });

  it('lets the later-registered scope win prop collisions (scopes should use disjoint namespaces)', () => {
    renderHook(() => useTrackingScope({ check_type: 'http' }));
    renderHook(() => useTrackingScope({ check_type: 'browser' }));

    trackScopeProbeEvent();

    expect(getLastReportedProps()).toEqual({ check_type: 'browser' });
  });

  it('drops undefined scope prop values instead of reporting them', () => {
    renderHook(() => useTrackingScope({ check_id: undefined, check_type: 'http' }));

    trackScopeProbeEvent();

    expect(getLastReportedProps()).toEqual({ check_type: 'http' });
  });

  it('lets scope props win over base props on key collision', () => {
    setTrackingBaseProps({ check_type: 'from-base' });
    renderHook(() => useTrackingScope({ check_type: 'from-scope' }));

    trackScopeProbeEvent();

    expect(getLastReportedProps()).toEqual({ check_type: 'from-scope' });
  });

  it('lets event props win over scope props on key collision', () => {
    renderHook(() => useTrackingScope({ check_type: 'from-scope' }));

    trackTypedScopeProbeEvent({ check_type: 'from-event' });

    expect(getLastReportedProps()).toEqual({ check_type: 'from-event' });
  });
});
