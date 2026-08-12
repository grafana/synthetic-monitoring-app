import { ReliabilityEvidence } from './types';
import { getExploreUrl } from 'utils';

export function getEvidenceExploreUrl(evidence: ReliabilityEvidence): string | undefined {
  const provenance = evidence.provenance;
  const from = Number(provenance?.range.from);
  const to = Number(provenance?.range.to);

  if (
    !provenance?.datasource.trim() ||
    !provenance.queries.length ||
    provenance.queries.some(({ expr }) => !expr.trim()) ||
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    from >= to
  ) {
    return undefined;
  }

  return getExploreUrl(provenance.datasource, provenance.queries, { from, to });
}
