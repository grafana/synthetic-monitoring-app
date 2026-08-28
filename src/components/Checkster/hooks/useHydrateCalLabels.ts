import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { CheckFormValues } from 'types';

import { partitionCalLabels } from '../transformations/toFormValues.utils';

export function useHydrateCalLabels(
  formMethods: UseFormReturn<CheckFormValues>,
  calNames: string[],
  defaultFormValues: CheckFormValues
) {
  useEffect(() => {
    if (calNames.length === 0) {
      return;
    }

    const { calLabels, labels } = formMethods.getValues();

    // Hydrated rows are written with shouldDirty: false so the form stays pristine, which means
    // a defaults reset (probes resolving, folder status arriving) wipes them — and when `labels`
    // is dirty, its CAL-valued rows are not restored either. The check's original labels still
    // hold those values, so they are the last-priority value source. Rows already in the form
    // win: a cleared CAL value is a dirty row that survives resets, so it stays cleared.
    const { calLabels: hydrated } = partitionCalLabels(
      [...calLabels, ...labels, ...defaultFormValues.labels],
      calNames
    );
    const { labels: remaining } = partitionCalLabels(labels, calNames);

    formMethods.setValue('calLabels', hydrated, { shouldDirty: false });
    formMethods.setValue('labels', remaining, { shouldDirty: false });
  }, [calNames, defaultFormValues, formMethods]);
}
