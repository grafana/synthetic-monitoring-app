import { useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValues } from '../../../types';

import { MultiHttpVariable } from '../../MultiHttp/MultiHttpTypes';

export function useMultiHttpVariables() {
  const baseField = 'settings.multihttp.entries' as const;
  const { watch } = useFormContext<CheckFormValues>();
  const entries = watch(baseField);
  const variablesRef = useRef<MultiHttpVariable[][]>([]);

  // Entries mutates, hence why we need to create a checksum on only variables,
  // to not cause rerender on every little button press in the form.
  variablesRef.current = entries.reduce<MultiHttpVariable[][]>((acc, entry) => {
    acc.push([...(entry.variables ?? [])]);

    return acc;
  }, []);

  const checksum = JSON.stringify(variablesRef);

  return useMemo(() => {
    return variablesRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variablesRef, checksum]);
}
