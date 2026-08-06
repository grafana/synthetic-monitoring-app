import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { CheckFormValues } from 'types';

import { partitionCalLabels } from '../transformations/toFormValues.utils';

export function useHydrateCalLabels(
  formMethods: UseFormReturn<CheckFormValues>,
  calNames: string[],
  defaultFormValues: CheckFormValues
) {
  const calNamesKey = calNames.join('\u0000');

  useEffect(() => {
    if (calNames.length === 0) {
      return;
    }

    const { calLabels, labels } = formMethods.getValues();
    const partitioned = partitionCalLabels([...calLabels, ...labels], calNames);

    formMethods.setValue('calLabels', partitioned.calLabels, { shouldDirty: false });
    formMethods.setValue('labels', partitioned.labels, { shouldDirty: false });
  }, [calNames, calNamesKey, defaultFormValues, formMethods]);
}
