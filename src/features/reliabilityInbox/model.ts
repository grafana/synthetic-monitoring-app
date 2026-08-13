import {
  OpportunityConfidence,
  OpportunityValue,
  ProposedHttpCheckDraft,
  ReliabilityOpportunity,
  ReliabilitySuggestion,
} from './types';
import { CheckType } from 'types';
import { isLocalReliabilityInboxStack } from '../../datasource/reliabilityInboxRegion';

const ONE_MINUTE_IN_MS = 60 * 1000;

export function parseSuggestedCheckConfig(prompt: string) {
  const job = prompt.match(/job "([^"]+)"/)?.[1];
  const frequency = prompt.match(/frequency ([^,\s]+)/)?.[1];
  const timeout = prompt.match(/timeout ([^,\s]+)/)?.[1];
  const statusCodes = prompt.match(/expect HTTP status \[([^\]]*)\]/)?.[1];
  const probeIds = prompt.match(/probe IDs \[([^\]]*)\]/)?.[1];

  return {
    job,
    frequencyMs: frequency ? parseDuration(frequency) : undefined,
    timeoutMs: timeout ? parseDuration(timeout) : undefined,
    validStatusCodes: parseNumberList(statusCodes),
    failIfNotSSL: /fail if not SSL/i.test(prompt),
    probeIds: parseNumberList(probeIds),
  };
}

export function toReliabilityOpportunity(suggestion: ReliabilitySuggestion): ReliabilityOpportunity {
  const proposedCheck = getProposedHttpCheckDraft(suggestion);
  const requestRate =
    suggestion.evidence.reqPerS === undefined ? undefined : `${formatDecimal(suggestion.evidence.reqPerS)} req/s`;

  return {
    id: suggestion.id,
    suggestion,
    subject: getSubject(suggestion.target),
    rationale: suggestion.rationale ?? 'Observed demand appears to have no equivalent synthetic coverage.',
    value: getValue(suggestion.relevance),
    confidence: getConfidence(suggestion.confidence),
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

/**
 * Orders the inbox by confidence first, then value, before using the backend
 * score as a tie-breaker. This keeps the high-confidence review set together
 * while ensuring high-value/high-confidence opportunities lead that set.
 */
export function compareReliabilityOpportunities(a: ReliabilityOpportunity, b: ReliabilityOpportunity) {
  const confidenceDifference = getConfidencePriority(b.confidence) - getConfidencePriority(a.confidence);
  if (confidenceDifference !== 0) {
    return confidenceDifference;
  }

  const valueDifference = getValuePriority(b.value) - getValuePriority(a.value);
  if (valueDifference !== 0) {
    return valueDifference;
  }

  const scoreDifference = b.sortScore - a.sortScore;
  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  return a.id.localeCompare(b.id);
}

export function isInitialReviewCandidate(suggestion: ReliabilitySuggestion, apiHost?: string) {
  const localStack = apiHost ? isLocalReliabilityInboxStack(apiHost) : false;

  if (
    suggestion.checkType !== CheckType.Http ||
    (suggestion.dedupStatus !== 'uncovered' && suggestion.dedupStatus !== 'partially_covered') ||
    (!localStack && suggestion.reachability !== 'public') ||
    suggestion.authRequired ||
    suggestion.needsConfiguration
  ) {
    return false;
  }

  try {
    const url = new URL(suggestion.target);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    return localStack || !isPrivateOrDevelopmentHost(url.hostname);
  } catch {
    return false;
  }
}

export function getProposedHttpCheckDraft(suggestion: ReliabilitySuggestion): ProposedHttpCheckDraft {
  const parsed = parseSuggestedCheckConfig(suggestion.prompt);
  const frequencyMs = parsed.frequencyMs ?? ONE_MINUTE_IN_MS;
  const timeoutMs = parsed.timeoutMs ?? 3000;
  const validStatusCodes = parsed.validStatusCodes.length > 0 ? parsed.validStatusCodes : [200];
  const probeIds = parsed.probeIds;

  return {
    job: parsed.job ?? getSubject(suggestion.target),
    target: suggestion.target,
    checkType: 'http',
    method: 'GET',
    frequencyMs,
    timeoutMs,
    validStatusCodes,
    failIfNotSSL: parsed.failIfNotSSL || suggestion.target.toLowerCase().startsWith('https://'),
    probeIds,
    locationPolicy:
      probeIds.length > 0
        ? `Run from the configured public probe${probeIds.length === 1 ? '' : 's'} with ID${probeIds.length === 1 ? '' : 's'} ${probeIds.join(', ')}.`
        : 'Select at least one public probe before creating the check.',
  };
}

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

  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) {
    return true;
  }

  const octets = host.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  return (
    octets[0] === 0 ||
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function getValue(relevance = 0): OpportunityValue {
  if (relevance >= 70) {
    return 'high';
  }
  if (relevance >= 40) {
    return 'medium';
  }
  return 'lower';
}

function getConfidence(confidence: string): OpportunityConfidence {
  const normalized = confidence.toLowerCase();
  if (normalized === 'high' || normalized === 'medium') {
    return normalized;
  }
  return 'low';
}

function getConfidencePriority(confidence: OpportunityConfidence) {
  return {
    high: 3,
    medium: 2,
    low: 1,
  }[confidence];
}

function getValuePriority(value: OpportunityValue) {
  return {
    high: 3,
    medium: 2,
    lower: 1,
  }[value];
}

function parseNumberList(value?: string) {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(Number.isFinite);
}

function parseDuration(value: string) {
  const units: Record<string, number> = { ms: 1, s: 1000, m: ONE_MINUTE_IN_MS, h: 60 * ONE_MINUTE_IN_MS };
  const matches = [...value.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)];

  if (matches.length === 0) {
    return undefined;
  }

  return matches.reduce((total, [, amount, unit]) => total + Number(amount) * units[unit], 0);
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) {
    return `${formatDecimal(value / 1_000_000)}M`;
  }
  if (value >= 1000) {
    return `${formatDecimal(value / 1000)}k`;
  }
  return Math.round(value).toString();
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
