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

export const createEventFactory = (product: string, featureName: string) => {
  return <P extends TrackingEventProps | undefined = undefined>(eventName: string) =>
    (props: P extends undefined ? void : P) => {
      const eventNameToReport = `${product}_${featureName}_${eventName}`;
      // global context props are resolved at fire time so they are always current;
      // more specific props win on key collision: event props > base props > global props
      reportInteraction(eventNameToReport, {
        ...omitUndefined(getGlobalTrackingProps()),
        ...baseProps,
        ...(props ?? {}),
      });
    };
};

export const createSMEventFactory = (featureName: string) => createEventFactory('synthetic-monitoring', featureName);
