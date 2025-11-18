import { RefinementCtx } from 'zod';

import { CheckFormValuesBase, ProbeWithMetadata } from 'types';

export function createProbeCompatibilityRefinement<T extends CheckFormValuesBase>(
  availableProbes: ProbeWithMetadata[],
  getChannel: (data: T) => string | null | undefined
) {
  return (data: T, ctx: RefinementCtx) => {
    const selectedChannel = getChannel(data);

    if (!selectedChannel) {
      return;
    }

    const probesById = new Map(availableProbes.map((probe) => [probe.id, probe]));
    const incompatibleProbes: string[] = [];

    data.probes.forEach((probeId) => {
      const probe = probesById.get(probeId);
      if (!probe || !probe.k6Versions) {
        return;
      }

      const version = probe.k6Versions[selectedChannel];
      const isCompatible = version !== null && version !== undefined;

      if (!isCompatible) {
        const probeName = probe.displayName || probe.name;
        incompatibleProbes.push(probeName);
      }
    });

    if (incompatibleProbes.length > 0) {
      const probeList =
        incompatibleProbes.length <= 3
          ? incompatibleProbes.join(', ')
          : `${incompatibleProbes.slice(0, 3).join(', ')} and ${incompatibleProbes.length - 3} more`;

      ctx.addIssue({
        code: 'custom',
        path: ['probes'],
        message: `Some of the selected probes above (${probeList}) are not compatible with channel "${selectedChannel}". Please unselect them or choose a different channel.`,
      });
    }
  };
}

