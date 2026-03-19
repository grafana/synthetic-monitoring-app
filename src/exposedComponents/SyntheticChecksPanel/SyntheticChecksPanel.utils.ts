import { Check } from 'types';

export function filterChecksByLabels(checks: Check[], labelFilters: Record<string, string>): Check[] {
  const entries = Object.entries(labelFilters);

  if (entries.length === 0) {
    return checks;
  }

  return checks.filter((check) =>
    entries.every(([key, value]) => check.labels.some((label) => label.name === key && label.value === value))
  );
}
