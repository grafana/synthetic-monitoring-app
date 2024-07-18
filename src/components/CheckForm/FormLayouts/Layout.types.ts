import { ReactElement } from 'react';
import { FieldPath } from 'react-hook-form';

import { CheckFormValues } from 'types';

export enum LayoutSection {
  Check = `Request`,
  Uptime = `Define Uptime`,
  Labels = `Labels`,
  Alerting = `Alerting`,
  Probes = `Execution`,
}

export type Section<T extends CheckFormValues> = {
  fields: Array<FieldPath<T>>;
  Component: ReactElement;
};
