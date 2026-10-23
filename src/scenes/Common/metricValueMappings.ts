import { LoadingState, MappingType, SpecialValueMatch, ValueMapping } from '@grafana/data';

/** A missing measurement is neither a passing nor a failing check. */
export function getMetricValueMappings(state?: LoadingState): ValueMapping[] {
  const pending =
    state === undefined ||
    state === LoadingState.NotStarted ||
    state === LoadingState.Loading ||
    state === LoadingState.Streaming;
  const result = { text: pending ? 'Loading...' : 'N/A', color: 'gray' };

  return [
    {
      type: MappingType.SpecialValue,
      options: { match: SpecialValueMatch.NullAndNaN, result },
    },
    {
      type: MappingType.ValueToText,
      options: { Infinity: result, '-Infinity': result },
    },
  ];
}
