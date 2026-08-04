import { createSMEventFactory, setTrackingBaseProps, TrackingEventProps } from 'features/tracking/utils';

interface SampleEvent extends TrackingEventProps {
  /** The type of check, to exercise event-specific props in tests. */
  checkType: string;
}

const trackSampleEvent = createSMEventFactory('test_feature')<SampleEvent>('sample_event');
const trackPropslessEvent = createSMEventFactory('test_feature')('propsless_event');

describe('createEventFactory', () => {
  const reportInteraction = jest.fn();

  beforeAll(() => {
    // the factory resolves reportInteraction from the mocked module object at call time,
    // so replacing the property intercepts it (jest.spyOn on a namespace import does not,
    // because the ESM interop hands the test a copy of the module object)
    jest.requireMock('@grafana/runtime').reportInteraction = reportInteraction;
  });

  beforeEach(() => {
    setTrackingBaseProps({});
    reportInteraction.mockClear();
  });

  it('reports the composed event name with the given props', () => {
    trackSampleEvent({ checkType: 'browser' });

    expect(reportInteraction).toHaveBeenCalledTimes(1);
    expect(reportInteraction).toHaveBeenCalledWith('synthetic-monitoring_test_feature_sample_event', {
      checkType: 'browser',
    });
  });

  it('includes base properties on events once set', () => {
    setTrackingBaseProps({ org_id: 442, stack_id: 2484 });
    trackSampleEvent({ checkType: 'browser' });

    expect(reportInteraction).toHaveBeenCalledWith('synthetic-monitoring_test_feature_sample_event', {
      org_id: 442,
      stack_id: 2484,
      checkType: 'browser',
    });
  });

  it('includes base properties on events without their own props', () => {
    setTrackingBaseProps({ org_id: 442, stack_id: 2484 });
    trackPropslessEvent();

    expect(reportInteraction).toHaveBeenCalledWith('synthetic-monitoring_test_feature_propsless_event', {
      org_id: 442,
      stack_id: 2484,
    });
  });

  it('omits base properties entirely when cloud identity is not available', () => {
    trackSampleEvent({ checkType: 'browser' });

    const [, props] = reportInteraction.mock.calls[0];
    expect(props).not.toHaveProperty('org_id');
  });

  it('drops undefined base property values instead of reporting them', () => {
    setTrackingBaseProps({ org_id: undefined, stack_id: 2484 });
    trackSampleEvent({ checkType: 'browser' });

    const [, props] = reportInteraction.mock.calls[0];
    expect(props).not.toHaveProperty('org_id');
    expect(props).toHaveProperty('stack_id', 2484);
  });

  it('lets event props win over base props on key collision', () => {
    setTrackingBaseProps({ checkType: 'http' });
    trackSampleEvent({ checkType: 'browser' });

    const [, props] = reportInteraction.mock.calls[0];
    expect(props).toEqual({ checkType: 'browser' });
  });
});
