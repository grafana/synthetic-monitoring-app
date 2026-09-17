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
    ownerHint: formatOwnerHint(suggestion.namespace, suggestion.ownerLabels),
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
 * Renders the attribution as "namespace: checkout · service: api" for the
 * suggested check's "Reported by" row. Only the labels a human recognises
 * their own work by, in a fixed order so the same suggestion always reads the
 * same.
 *
 * The namespace leads and is repeated from its badge on purpose: the row is
 * the full evidence for the attribution, and reading it should not require
 * looking back at the header to learn which namespace the rest belongs to.
 */
function formatOwnerHint(namespace?: string, ownerLabels?: Record<string, string>) {
  const labelled: Array<[string, string]> = namespace ? [['namespace', namespace]] : [];

  // Same order as the service's contextLabels, so the row reads the same as
  // the payload it came from.
  for (const label of ['team', 'owner', 'service', 'app', 'ingress', 'job', 'cluster']) {
    const value = ownerLabels?.[label];
    if (!value || (label === 'job' && restatesAShownValue(value, namespace, ownerLabels?.service))) {
      continue;
    }

    labelled.push([label, value]);
  }

  return labelled.length > 0 ? labelled.map(([label, value]) => `${label}: ${value}`).join(' · ') : undefined;
}

/**
 * kube-prometheus renders `job` as "<namespace>/<service>", which only repeats
 * what is printed beside it — on dev every ingress-derived host reported
 * job="ingress-nginx/ingress-nginx-controller", identical across all of them.
 *
 * A plain Prometheus setup instead uses the scrape job name ("payments-api"),
 * which IS a useful owner hint, so the label is shown by default and dropped
 * only when it restates a value already on screen.
 */
function restatesAShownValue(job: string, namespace?: string, service?: string) {
  return [namespace, service].some((shown) => !!shown && job.includes(shown));
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
