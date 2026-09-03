import { useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { CheckFormValues, Label } from 'types';

import { rehydrateCalLabels } from '../transformations/toFormValues.utils';

export function useHydrateCalLabels(
  formMethods: UseFormReturn<CheckFormValues>,
  calNames: string[],
  defaultFormValues: CheckFormValues
) {
  const previousCalLabelsRef = useRef<Label[]>([]);

  useEffect(() => {
    if (calNames.length === 0) {
      return;
    }

    const { calLabels, labels } = formMethods.getValues();
    const hydrated = rehydrateCalLabels({
      calNames,
      calLabels,
      labels,
      previousCalLabels: previousCalLabelsRef.current,
      defaultLabels: defaultFormValues.labels,
    });

    previousCalLabelsRef.current = hydrated.calLabels;
    formMethods.setValue('calLabels', hydrated.calLabels, { shouldDirty: false });
    formMethods.setValue('labels', hydrated.labels, { shouldDirty: false });
  }, [calNames, defaultFormValues, formMethods]);
}
