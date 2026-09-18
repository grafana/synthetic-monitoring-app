import { ReliabilityEvidence } from './types';
import { getExploreUrl } from 'utils';

const INLINE_TREND_RATE_WINDOW = '5m';
const STATUS_DISTRIBUTION_PATTERN =
  /^sum\s+by\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*\(\s*rate\s*\(\s*(.+)\[5m\]\s*\)\s*\)\s*$/;
const EXPLORE_QUERY_PRESENTATION: Record<string, { refId: string; legendFormat: string }> = {
  A: { refId: 'RequestRate', legendFormat: 'Requests per second' },
  B: { refId: 'ServerErrorRatio', legendFormat: '5xx response ratio' },
  C: { refId: 'P99ResponseTime', legendFormat: 'p99 response time' },
};

export function getEvidenceExploreUrl(evidence: ReliabilityEvidence): string | undefined {
  const provenance = getRecommendationTelemetryProvenance(evidence);

  if (!provenance) {
    return undefined;
  }

  const queries = provenance.queries.map((query) => ({
    ...query,
    ...EXPLORE_QUERY_PRESENTATION[query.refId],
  }));

  return getExploreUrl(provenance.datasource, queries, { from: provenance.from, to: provenance.to });
}

export function getRecommendationTelemetryProvenance(evidence: ReliabilityEvidence) {
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

  return {
    datasource: provenance.datasource,
    from,
    to,
    queries: provenance.queries.map((query, index) => {
      const refId = query.refId?.trim() || String.fromCharCode(65 + index);
      const trendExpression = query.expr.replaceAll('[1h]', `[${INLINE_TREND_RATE_WINDOW}]`);

      return {
        ...query,
        refId,
        expr: refId === 'B' ? to5xxRatioExpression(trendExpression) : trendExpression,
        instant: false,
        range: true,
      };
    }),
  };
}

function to5xxRatioExpression(statusDistributionExpression: string) {
  const match = statusDistributionExpression.match(STATUS_DISTRIBUTION_PATTERN);

  if (!match) {
    return statusDistributionExpression;
  }

  const [, statusLabel, selector] = match;
  const errorSelector = addLabelMatcher(selector.trim(), `${statusLabel}=~"5.."`);

  return `sum(rate(${errorSelector}[${INLINE_TREND_RATE_WINDOW}])) / sum(rate(${selector.trim()}[${INLINE_TREND_RATE_WINDOW}]))`;
}

function addLabelMatcher(selector: string, matcher: string) {
  const openingBrace = selector.indexOf('{');
  const closingBrace = selector.lastIndexOf('}');

  if (openingBrace >= 0 && closingBrace === selector.length - 1) {
    const existingMatchers = selector.slice(openingBrace + 1, closingBrace).trim();
    return `${selector.slice(0, openingBrace + 1)}${existingMatchers}${existingMatchers ? ', ' : ''}${matcher}}`;
  }

  return `${selector}{${matcher}}`;
}
