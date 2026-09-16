import { Address4, Address6 } from 'ip-address';

import { ReliabilitySuggestion } from './types';
import { CheckType } from 'types';

import { getProposedHttpCheckDraft, getSuggestionSubject } from './proposedCheck';

export function toReliabilityOpportunity(suggestion: ReliabilitySuggestion) {
  const proposedCheck = getProposedHttpCheckDraft(suggestion);
  const requestRate =
    suggestion.evidence.reqPerS === undefined ? undefined : `${formatDecimal(suggestion.evidence.reqPerS)} req/s`;

  return {
    id: suggestion.id,
    suggestion,
    subject: getSuggestionSubject(suggestion.target),
    namespace: suggestion.namespace,
    ownerHint: formatOwnerHint(suggestion.ownerLabels),
    sortScore: suggestion.relevance ?? suggestion.score * 100,
    requestVolume:
      suggestion.evidence.reqPerS === undefined
        ? undefined
        : formatCompactNumber(suggestion.evidence.reqPerS * 60 * 60),
    requestRate,
    errorRate: formatErrorRate(suggestion.evidence.errorRatio),
    p99: suggestion.evidence.p99Ms === undefined ? undefined : `${formatDecimal(suggestion.evidence.p99Ms)} ms`,
    proposedCheck,
  };
}

export type ReliabilityOpportunity = ReturnType<typeof toReliabilityOpportunity>;

/**
 * Renders the ownership hints as "team: payments · service: api" for the
 * suggested check's "Reported by" row. Only the labels a human recognises
 * their own work by, in a fixed order so the same suggestion always reads
 * the same. `namespace` is omitted: it has its own badge.
 */
function formatOwnerHint(ownerLabels?: Record<string, string>) {
  if (!ownerLabels) {
    return undefined;
  }

  const hint = ['team', 'owner', 'service', 'app', 'ingress', 'cluster']
    .filter((label) => ownerLabels[label])
    .map((label) => `${label}: ${ownerLabels[label]}`)
    .join(' · ');

  return hint || undefined;
}

/** The namespaces present in the loaded suggestions, for the filter's options. */
export function getNamespaceOptions(opportunities: ReliabilityOpportunity[]) {
  return Array.from(
    new Set(opportunities.map(({ namespace }) => namespace).filter((namespace): namespace is string => !!namespace))
  ).sort();
}

/** Orders eligible recommendations by technical relevance. */
export function compareReliabilityOpportunities(a: ReliabilityOpportunity, b: ReliabilityOpportunity) {
  return b.sortScore - a.sortScore || a.id.localeCompare(b.id);
}

export function isInitialReviewCandidate(suggestion: ReliabilitySuggestion) {
  if (
    suggestion.checkType !== CheckType.Http ||
    suggestion.dedupStatus !== 'uncovered' ||
    suggestion.confidence.toLowerCase() !== 'high' ||
    suggestion.reachability !== 'public' ||
    suggestion.authRequired ||
    suggestion.needsConfiguration
  ) {
    return false;
  }

  try {
    const url = new URL(suggestion.target);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !isPrivateOrDevelopmentHost(url.hostname);
  } catch {
    return false;
  }
}

function isPrivateOrDevelopmentHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host === 'host.docker.internal' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.test')
  ) {
    return true;
  }

  if (Address4.isValid(host)) {
    const address = new Address4(host);
    return (
      address.toArray()[0] === 0 ||
      address.isPrivate() ||
      address.isLoopback() ||
      address.isLinkLocal() ||
      address.isUnspecified()
    );
  }

  if (Address6.isValid(host)) {
    const address = new Address6(host);
    return address.isPrivate() || address.isLoopback() || address.isLinkLocal() || address.isUnspecified();
  }

  return false;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
    .format(value)
    .replace('K', 'k');
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

function formatErrorRate(ratio?: number) {
  if (ratio === undefined) {
    return undefined;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: ratio > 0 && ratio < 0.001 ? 2 : 1,
    maximumFractionDigits: 2,
  }).format(ratio);
}
