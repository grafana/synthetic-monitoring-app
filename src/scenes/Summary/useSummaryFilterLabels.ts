import { useMemo } from 'react';
import { AdHocFiltersVariable } from '@grafana/scenes';

import { Check } from 'types';
import { LabelMode } from 'datasource/responses.types';
import { useLabelMode } from 'data/useLabelMode';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';

export function useSummaryFilterLabels(checks: Check[]) {
  const { visibleChecks, isResolving } = useCheckFolderAccess(checks);

  const { data: labelModeState } = useLabelMode();
  const usePrefix = labelModeState?.mode !== LabelMode.Unprefixed;

  return useMemo(() => {
    const labels = new Map<string, Set<string>>();
    if (!isResolving) {
      for (const check of visibleChecks) {
        for (const { name, value } of check.labels) {
          const values = labels.get(name) ?? new Set<string>();
          values.add(value);
          labels.set(name, values);
        }
      }
    }

    // Map actual query keys explicitly: a user label may itself start with label_.
    const queryLabels = new Map<string, Set<string>>();
    for (const [name, values] of labels) {
      queryLabels.set(usePrefix ? name : `label_${name}`, values);
    }
    for (const [name, values] of labels) {
      queryLabels.set(usePrefix ? `label_${name}` : name, values);
    }

    return {
      getTagKeysProvider: async () => ({
        replace: true,
        values: Array.from(labels.keys()).map((name) => ({ text: name, value: usePrefix ? `label_${name}` : name })),
      }),
      getTagValuesProvider: async (_variable: AdHocFiltersVariable, filter: { key: string }) => ({
        replace: true,
        values: Array.from(queryLabels.get(filter.key) ?? []).map((value) => ({
          text: value,
          value,
        })),
      }),
    };
  }, [visibleChecks, isResolving, usePrefix]);
}
