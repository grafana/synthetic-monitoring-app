import { LoadingState, MappingType, SpecialValueMatch, ValueMapping } from '@grafana/data';

/** A missing measurement is neither a passing nor a failing check. */
export function getMetricValueMappings(state?: LoadingState, color = 'gray'): ValueMapping[] {
  const pending =
    state === undefined ||
    state === LoadingState.NotStarted ||
    state === LoadingState.Loading ||
    state === LoadingState.Streaming;
  const result = { text: pending ? 'Loading...' : 'N/A', color };

  return [
    {
      type: MappingType.SpecialValue,
      options: { match: SpecialValueMatch.NullAndNaN, result },
    },
  ];
}
