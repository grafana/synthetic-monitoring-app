import { ProbeWithMetadata } from 'types';

export function filterProbes(probes: ProbeWithMetadata[], search: string) {
  return probes.filter(
    (probe) =>
      probe.region.toLowerCase().includes(search) ||
      probe.name.toLowerCase().includes(search) ||
      probe.displayName.toLowerCase().includes(search) ||
      probe.longRegion.toLowerCase().includes(search) ||
      probe.provider.toLowerCase().includes(search) ||
      probe.country.toLowerCase().includes(search) ||
      probe.countryCode.toLowerCase().includes(search)
  );
}
