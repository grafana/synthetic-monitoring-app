// eslint-disable-next-line no-restricted-imports
import { reportInteraction } from '@grafana/runtime';

export type TrackingEventProps = {
  [key: string]: boolean | string | number | undefined;
};

export const createEventFactory = (product: string, featureName: string) => {
  return <P extends TrackingEventProps | undefined = undefined>(eventName: string) =>
    (props: P extends undefined ? void : P) => {
      const eventNameToReport = `${product}_${featureName}_${eventName}`;

      reportInteraction(eventNameToReport, props ?? undefined);
    };
};

export const createSMEventFactory = (featureName: string) => createEventFactory('synthetic-monitoring', featureName);
