// eslint-disable-next-line no-restricted-imports
import { reportInteraction } from '@grafana/runtime';

export type TrackingEventProps = {
  [key: string]: boolean | string | number | undefined;
};

// Properties included on every event created through the factory, e.g. the Grafana Cloud
// org identity. They resolve asynchronously (SM tenant API), so events fired before
// resolution omit them entirely rather than reporting undefined values.
let baseProps: TrackingEventProps = {};

export const setTrackingBaseProps = (props: TrackingEventProps) => {
  baseProps = Object.fromEntries(Object.entries(props).filter(([_, value]) => value !== undefined));
};

export const createEventFactory = (product: string, featureName: string) => {
  return <P extends TrackingEventProps | undefined = undefined>(eventName: string) =>
    (props: P extends undefined ? void : P) => {
      const eventNameToReport = `${product}_${featureName}_${eventName}`;
      reportInteraction(eventNameToReport, { ...baseProps, ...(props ?? {}) });
    };
};

export const createSMEventFactory = (featureName: string) => createEventFactory('synthetic-monitoring', featureName);
