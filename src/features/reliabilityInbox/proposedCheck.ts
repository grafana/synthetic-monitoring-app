import { durationToMilliseconds, isValidDuration, parseDuration } from '@grafana/data';

import { ReliabilitySuggestion } from './types';

const ONE_MINUTE_IN_MS = 60 * 1000;

export function parseSuggestedHttpCheckConfig(prompt: string) {
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

export function getProposedHttpCheckDraft(suggestion: ReliabilitySuggestion) {
  const parsed = parseSuggestedHttpCheckConfig(suggestion.prompt);
  const frequencyMs = parsed.frequencyMs ?? ONE_MINUTE_IN_MS;
  const timeoutMs = parsed.timeoutMs ?? 3000;
  const validStatusCodes = parsed.validStatusCodes.length > 0 ? parsed.validStatusCodes : [200];
  const probeIds = parsed.probeIds;

  return {
    job: parsed.job ?? getSuggestionSubject(suggestion.target),
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

export function getSuggestionSubject(target: string) {
  try {
    const url = new URL(target);
    const path = url.pathname === '/' ? '' : url.pathname;
    return `${url.host}${path}`;
  } catch {
    return target;
  }
}

function parseNumberList(value?: string) {
  return (
    value
      ?.split(',')
      .filter((item) => item.trim())
      .map(Number)
      .filter(Number.isFinite) ?? []
  );
}

function parsePromptDuration(value: string) {
  const duration = value.replace(/([hms])(?=\d)/g, '$1 ');
  return isValidDuration(duration) ? durationToMilliseconds(parseDuration(duration)) : undefined;
}
