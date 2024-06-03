import { ReactElement } from 'react';
import { FieldPath } from 'react-hook-form';

import { CheckFormValues } from 'types';

export enum LayoutSection {
  Check = `Request`,
  Uptime = `Define Uptime`,
  Probes = `Probes`,
  Labels = `Labels`,
  Alerting = `Alerting`,
  Review = `Review`,
}

export type Section<T extends CheckFormValues> = {
  label: string;
  fields: Array<FieldPath<T>>;
  Component: ReactElement;
};
