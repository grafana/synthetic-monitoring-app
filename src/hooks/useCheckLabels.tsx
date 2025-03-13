import { useMemo } from 'react';

import { useChecks } from 'data/useChecks';

/**
 * Returns a list of unique labels from all checks
 */
export function useCheckLabels() {
  const { data = [] } = useChecks();

  return useMemo(() => {
    const labels = data?.reduce((acc, check) => {
      acc.push(...check.labels.map((label) => label.name));
      return acc;
    }, [] as string[]);

    return [...new Set(labels)];
  }, [data]);
}
