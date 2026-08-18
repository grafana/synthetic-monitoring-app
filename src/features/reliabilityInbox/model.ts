import { durationToMilliseconds, isValidDuration, parseDuration } from '@grafana/data';
import { Address4, Address6 } from 'ip-address';

import { ReliabilitySuggestion } from './types';
import { CheckType } from 'types';

const ONE_MINUTE_IN_MS = 60 * 1000;

export function parseSuggestedCheckConfig(prompt: string) {
  const job = prompt.match(/job "([^"]+)"/)?.[1];
  const frequency = prompt.match(/frequency ([^,\s]+)/)?.[1];
  const timeout = prompt.match(/timeout ([^,\s]+)/)?.[1];
  const statusCodes = prompt.match(/expect HTTP status \[([^\]]*)\]/)?.[1];
  const probeIds = prompt.match(/probe IDs \[([^\]]*)\]/)?.[1];

  return {
    job,
    frequencyMs: frequency ? parsePromptDuration(frequency) : undefined,
    timeoutMs: timeout ? parsePromptDuration(timeout) : undefined,
    validStatusCodes: parseNumberList(statusCodes),
    failIfNotSSL: /fail if not SSL/i.test(prompt),
    probeIds: parseNumberList(probeIds),
  };
}

export function toReliabilityOpportunity(suggestion: ReliabilitySuggestion) {
  const proposedCheck = getProposedHttpCheckDraft(suggestion);
  const requestRate =
    suggestion.evidence.reqPerS === undefined ? undefined : `${formatDecimal(suggestion.evidence.reqPerS)} req/s`;

  return {
    id: suggestion.id,
    suggestion,
    subject: getSubject(suggestion.target),
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

export function getProposedHttpCheckDraft(suggestion: ReliabilitySuggestion) {
  const parsed = parseSuggestedCheckConfig(suggestion.prompt);
  const frequencyMs = parsed.frequencyMs ?? ONE_MINUTE_IN_MS;
  const timeoutMs = parsed.timeoutMs ?? 3000;
  const validStatusCodes = parsed.validStatusCodes.length > 0 ? parsed.validStatusCodes : [200];
  const probeIds = parsed.probeIds;

  return {
    job: parsed.job ?? getSubject(suggestion.target),
    target: suggestion.target,
    checkType: 'http' as const,
    method: 'GET' as const,
    frequencyMs,
    timeoutMs,
    validStatusCodes,
    failIfNotSSL: parsed.failIfNotSSL || suggestion.target.toLowerCase().startsWith('https://'),
    probeIds,
    locationPolicy:
      probeIds.length > 0
        ? `Run from the configured public probe${probeIds.length === 1 ? '' : 's'} with ID${probeIds.length === 1 ? '' : 's'} ${probeIds.join(', ')}.`
        : 'Probe locations will be selected during review.',
  };
}

export type ProposedHttpCheckDraft = ReturnType<typeof getProposedHttpCheckDraft>;

function getSubject(target: string) {
  try {
    const url = new URL(target);
    const path = url.pathname === '/' ? '' : url.pathname;
    return `${url.host}${path}`;
  } catch {
    return target;
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

function parseNumberList(value?: string) {
  return value?.split(',').filter((item) => item.trim()).map(Number).filter(Number.isFinite) ?? [];
}

function parsePromptDuration(value: string) {
  const duration = value.replace(/([hms])(?=\d)/g, '$1 ');
  return isValidDuration(duration) ? durationToMilliseconds(parseDuration(duration)) : undefined;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value).replace('K', 'k');
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
