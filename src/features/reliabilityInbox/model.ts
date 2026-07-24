import {
  OpportunityConfidence,
  OpportunityReadiness,
  OpportunityValue,
  ProposedHttpCheckDraft,
  ReliabilityOpportunity,
  ReliabilitySuggestion,
  SuggestedCheckConfig,
} from './types';
import {
  AlertSensitivity,
  Check,
  CheckType,
  DNSCheck,
  DnsProtocol,
  DnsRecordType,
  DnsResponseCodes,
  HTTPCheck,
  HTTPCompressionAlgo,
  HttpMethod,
  IpVersion,
} from 'types';

const ONE_MINUTE_IN_MS = 60 * 1000;
const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

export function parseSuggestedCheckConfig(prompt: string): SuggestedCheckConfig {
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

export function suggestionToCheckDraft(suggestion: ReliabilitySuggestion, availableProbeIds: number[] = []): Check {
  const config = parseSuggestedCheckConfig(suggestion.prompt);
  const availableProbes = config.probeIds.filter((id) => availableProbeIds.includes(id));

  if (suggestion.checkType === CheckType.Dns) {
    const check: DNSCheck = {
      job: config.job ?? suggestion.target,
      target: suggestion.target,
      frequency: config.frequencyMs ?? ONE_MINUTE_IN_MS,
      timeout: config.timeoutMs ?? 3000,
      enabled: true,
      alertSensitivity: AlertSensitivity.None,
      basicMetricsOnly: true,
      labels: [],
      probes: availableProbes,
      settings: {
        dns: {
          recordType: DnsRecordType.A,
          // An empty resolver deliberately keeps a private-zone recommendation invalid
          // until the user chooses the resolver that can actually reach it.
          server: suggestion.needsConfiguration ? '' : 'dns.google',
          ipVersion: IpVersion.V4,
          protocol: DnsProtocol.Udp,
          port: 53,
          validRCodes: [DnsResponseCodes.Noerror],
          validateAdditionalRRS: {
            failIfMatchesRegexp: [],
            failIfNotMatchesRegexp: [],
          },
          validateAnswerRRS: {
            failIfMatchesRegexp: [],
            failIfNotMatchesRegexp: [],
          },
          validateAuthorityRRS: {
            failIfMatchesRegexp: [],
            failIfNotMatchesRegexp: [],
          },
        },
      },
    };

    return check;
  }

  const check: HTTPCheck = {
    job: config.job ?? getSubject(suggestion.target),
    target: suggestion.target,
    frequency: config.frequencyMs ?? ONE_MINUTE_IN_MS,
    timeout: config.timeoutMs ?? 3000,
    enabled: true,
    alertSensitivity: AlertSensitivity.None,
    basicMetricsOnly: true,
    labels: [],
    probes: availableProbes,
    settings: {
      http: {
        method: HttpMethod.Get,
        ipVersion: IpVersion.V4,
        noFollowRedirects: false,
        compression: HTTPCompressionAlgo.None,
        failIfNotSSL: config.failIfNotSSL,
        failIfSSL: false,
        failIfBodyMatchesRegexp: [],
        failIfBodyNotMatchesRegexp: [],
        failIfHeaderMatchesRegexp: [],
        failIfHeaderNotMatchesRegexp: [],
        headers: [],
        proxyConnectHeaders: [],
        validHTTPVersions: [],
        validStatusCodes: config.validStatusCodes,
      },
    },
  };

  return check;
}

export function toReliabilityOpportunity(suggestion: ReliabilitySuggestion): ReliabilityOpportunity {
  const proposedCheck = getProposedHttpCheckDraft(suggestion);
  const config = {
    frequencyMs: proposedCheck.frequencyMs,
    timeoutMs: proposedCheck.timeoutMs,
    validStatusCodes: proposedCheck.validStatusCodes,
    failIfNotSSL: proposedCheck.failIfNotSSL,
    probeIds: proposedCheck.probeIds,
  };
  const readiness = getReadiness(suggestion);
  const requestRate = `${formatDecimal(suggestion.evidence.reqPerS)} req/s`;
  const reachability = getReachabilityLabel(suggestion);
  const frequency = config.frequencyMs ? formatFrequency(config.frequencyMs) : 'Default schedule';
  const locations = config.probeIds.length;
  const locationCopy = locations === 1 ? '1 location' : `${locations} locations`;
  const assertion =
    suggestion.checkType === CheckType.Http && config.validStatusCodes.length > 0
      ? `assert ${config.validStatusCodes.join(', ')}`
      : readiness === 'needs-setup'
        ? 'configuration required'
        : 'assertion needs review';

  return {
    id: suggestion.id,
    suggestion,
    subject: getSubject(suggestion.target),
    observedSummary: `${requestRate} · ${reachability} · last hour`,
    rationale: suggestion.rationale ?? 'Observed demand appears to have no equivalent synthetic coverage.',
    value: getValue(suggestion.relevance),
    confidence: getConfidence(suggestion.confidence),
    readiness,
    actionTitle: `Suggested ${suggestion.checkType.toUpperCase()} check`,
    actionSummary:
      readiness === 'needs-setup'
        ? (suggestion.configurationReason ?? 'Additional configuration is required before this check can run.')
        : `${frequency} · ${locationCopy} · ${assertion}`,
    estimatedUsage: estimateMonthlyUsage(config),
    sortScore: suggestion.relevance ?? suggestion.score * 100,
    requestVolume: formatCompactNumber(suggestion.evidence.reqPerS * 60 * 60),
    requestRate,
    errorRate: formatErrorRate(suggestion),
    p99: `${formatDecimal(suggestion.evidence.p99Ms)} ms`,
    proposedCheck,
  };
}

export function isInitialReviewCandidate(suggestion: ReliabilitySuggestion) {
  if (
    suggestion.checkType !== CheckType.Http ||
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

export function getProposedHttpCheckDraft(suggestion: ReliabilitySuggestion): ProposedHttpCheckDraft {
  const parsed = parseSuggestedCheckConfig(suggestion.prompt);
  const structured = suggestion.proposedCheck;
  const frequencyMs = structured?.frequencyMs ?? parsed.frequencyMs ?? ONE_MINUTE_IN_MS;
  const timeoutMs = structured?.timeoutMs ?? parsed.timeoutMs ?? 3000;
  const validStatusCodes =
    structured?.validStatusCodes ?? (parsed.validStatusCodes.length > 0 ? parsed.validStatusCodes : [200]);
  const probeIds = structured?.probeIds ?? parsed.probeIds;
  const failIfNotSSL =
    structured?.failIfNotSSL ?? (parsed.failIfNotSSL || suggestion.target.toLowerCase().startsWith('https://'));
  const locationPolicy =
    structured?.locationPolicy ??
    (probeIds.length > 0
      ? `Run from the configured public probe${probeIds.length === 1 ? '' : 's'} with ID${probeIds.length === 1 ? '' : 's'} ${probeIds.join(', ')}.`
      : 'Select at least one public probe before creating the check.');

  return {
    job: structured?.job ?? parsed.job ?? getSubject(suggestion.target),
    target: suggestion.target,
    checkType: 'http',
    method: 'GET',
    frequencyMs,
    timeoutMs,
    validStatusCodes,
    failIfNotSSL,
    probeIds,
    locationPolicy,
    estimatedExecutionsPerMonth: probeIds.length > 0 ? (ONE_MONTH_IN_MS / frequencyMs) * probeIds.length : undefined,
  };
}

export function formatDuration(durationMs: number) {
  if (durationMs % ONE_MINUTE_IN_MS === 0) {
    return `${durationMs / ONE_MINUTE_IN_MS} minute${durationMs === ONE_MINUTE_IN_MS ? '' : 's'}`;
  }

  if (durationMs % 1000 === 0) {
    return `${durationMs / 1000} seconds`;
  }

  return `${durationMs} ms`;
}

export function formatExecutions(value: number) {
  return formatCompactNumber(value);
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

function getReadiness(suggestion: ReliabilitySuggestion): OpportunityReadiness {
  if (suggestion.needsConfiguration || suggestion.authRequired || suggestion.reachability !== 'public') {
    return 'needs-setup';
  }

  return 'ready';
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

function getReachabilityLabel(suggestion: ReliabilitySuggestion) {
  if (suggestion.reachability === 'public') {
    return 'public endpoint';
  }
  if (suggestion.reachability === 'nxdomain') {
    return 'private DNS';
  }
  return suggestion.reachability.replaceAll('_', ' ');
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

function formatFrequency(frequencyMs: number) {
  if (frequencyMs % ONE_MINUTE_IN_MS === 0) {
    return `Every ${frequencyMs / ONE_MINUTE_IN_MS}m`;
  }
  return `Every ${frequencyMs / 1000}s`;
}

function estimateMonthlyUsage(config: SuggestedCheckConfig) {
  if (!config.frequencyMs || config.probeIds.length === 0) {
    return undefined;
  }

  const executions = (ONE_MONTH_IN_MS / config.frequencyMs) * config.probeIds.length;
  return `Estimated usage: ${formatCompactNumber(executions)} executions / month`;
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

function formatErrorRate(suggestion: ReliabilitySuggestion) {
  const errors = Object.entries(suggestion.evidence.statusDistribution).reduce((total, [status, rate]) => {
    return Number(status) >= 400 ? total + rate : total;
  }, 0);
  const ratio = suggestion.evidence.reqPerS > 0 ? errors / suggestion.evidence.reqPerS : 0;

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: ratio > 0 && ratio < 0.001 ? 2 : 1,
    maximumFractionDigits: 2,
  }).format(ratio);
}
