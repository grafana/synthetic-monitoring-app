// eslint-disable-next-line no-restricted-imports
import { reportInteraction } from '@grafana/runtime';
import { getGlobalTrackingProps } from 'features/tracking/globalTrackingProps';

export type TrackingEventProps = {
  [key: string]: boolean | string | number | undefined;
};

const omitUndefined = (props: TrackingEventProps): TrackingEventProps =>
  Object.fromEntries(Object.entries(props).filter(([_, value]) => value !== undefined));

// Properties included on every event created through the factory, e.g. the Grafana Cloud
// org identity. They resolve asynchronously (SM tenant API), so events fired before
// resolution omit them entirely rather than reporting undefined values.
let baseProps: TrackingEventProps = {};

export const setTrackingBaseProps = (props: TrackingEventProps) => {
  baseProps = omitUndefined(props);
};

// Props contributed by mounted components, keyed per useTrackingScope instance and
// merged in registration order. Concurrent scopes must use disjoint prop namespaces
// (`check_*`, `time_range_*`, ...) because collision order between them follows effect
// timing and is not a supported semantic.
const trackingScopes = new Map<symbol, TrackingEventProps>();

/** Prefer the useTrackingScope hook over calling this directly. */
export const registerTrackingScope = (id: symbol, props: TrackingEventProps) => {
  trackingScopes.set(id, omitUndefined(props));
};

/** Prefer the useTrackingScope hook over calling this directly. */
export const unregisterTrackingScope = (id: symbol) => {
  trackingScopes.delete(id);
};

const getTrackingScopeProps = (): TrackingEventProps => {
  const merged: TrackingEventProps = {};

  for (const props of trackingScopes.values()) {
    Object.assign(merged, props);
  }

  return merged;
};

export const createEventFactory = (product: string, featureName: string) => {
  return <P extends TrackingEventProps | undefined = undefined>(eventName: string) =>
    (props: P extends undefined ? void : P) => {
      const eventNameToReport = `${product}_${featureName}_${eventName}`;
      // more specific props win on key collision: event props > scope props > base props > global props
      reportInteraction(eventNameToReport, {
        ...omitUndefined(getGlobalTrackingProps()),
        ...baseProps,
        ...getTrackingScopeProps(),
        ...(props ?? {}),
      });
    };
};

export const createSMEventFactory = (featureName: string) => createEventFactory('synthetic-monitoring', featureName);
