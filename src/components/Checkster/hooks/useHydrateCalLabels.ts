import { useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { CheckFormValues, Label } from 'types';

import { partitionCalLabels } from '../transformations/toFormValues.utils';

export function useHydrateCalLabels(
  formMethods: UseFormReturn<CheckFormValues>,
  calNames: string[],
  defaultFormValues: CheckFormValues
) {
  const lastHydratedCalLabelsRef = useRef<Label[]>([]);

  useEffect(() => {
    if (calNames.length === 0) {
      return;
    }

    const { calLabels, labels } = formMethods.getValues();
    // Hydrated values are written with shouldDirty: false so the form stays pristine, which
    // means a reset (probes resolving, folder status arriving) restores the unpartitioned
    // defaults: calLabels is emptied and, when `labels` is dirty, the CAL-valued rows are not
    // restored either. The previous hydration result is the last-priority value source so CAL
    // values survive such resets. Rows the user edited are dirty, so resets keep them and they
    // take priority here — a deliberately cleared value stays cleared.
    const partitioned = partitionCalLabels([...calLabels, ...labels, ...lastHydratedCalLabelsRef.current], calNames);

    lastHydratedCalLabelsRef.current = partitioned.calLabels;
    formMethods.setValue('calLabels', partitioned.calLabels, { shouldDirty: false });
    formMethods.setValue('labels', partitioned.labels, { shouldDirty: false });
  }, [calNames, defaultFormValues, formMethods]);
}
