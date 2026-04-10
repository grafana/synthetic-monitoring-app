import { Probe, ProbeWithMetadata } from 'types';
import { isK6VersionUnknown } from 'components/CheckEditor/CheckProbes/CheckProbes.utils';

export function formatK6VersionsInline(probe: ProbeWithMetadata | Probe) {
  if (!probe.k6Versions || Object.keys(probe.k6Versions).length === 0) {
    return 'unknown';
  }
  const unique = [
    ...new Set(
      Object.values(probe.k6Versions)
        .filter((v): v is string => v !== null)
        .map((v) => (isK6VersionUnknown(v) ? 'unknown' : `v${v}`))
    ),
  ];
  return unique.join(', ') || 'unknown';
}
