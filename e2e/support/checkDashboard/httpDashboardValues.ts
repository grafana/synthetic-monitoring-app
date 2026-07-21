const DISPLAYED_NUMBER = String.raw`[+-]?(?:\d+(?:,\d{3})*(?:\.\d+)?|\.\d+)`;
const DISPLAYED_VALUE_WITH_UNIT = new RegExp(
  String.raw`^(${DISPLAYED_NUMBER})\s*(ns|µs|ms|s|min|hours?|days?|weeks?|years?)$`,
  'i'
);

const GRAFANA_MILLISECONDS_BY_UNIT: Record<string, number> = {
  ms: 1,
  s: 1_000,
  min: 60_000,
  hour: 3_600_000,
  hours: 3_600_000,
  day: 86_400_000,
  days: 86_400_000,
  week: 604_800_000,
  weeks: 604_800_000,
  year: 31_536_000_000,
  years: 31_536_000_000,
};

const GRAFANA_SECONDS_BY_UNIT: Record<string, number> = {
  ns: 0.000_000_001,
  µs: 0.000_001,
  ms: 0.001,
  s: 1,
  min: 60,
  hour: 3_600,
  hours: 3_600,
  day: 86_400,
  days: 86_400,
  week: 604_800,
  weeks: 604_800,
  year: 31_556_900,
  years: 31_556_900,
};

function normalizeDisplayedNumber(value: string): number {
  return Number(value.replaceAll(',', '').replace('−', '-'));
}

function parseDisplayedValueWithUnit(value: string, millisecondsByUnit: Record<string, number>): number {
  const normalized = value.trim().replace('−', '-');
  const match = DISPLAYED_VALUE_WITH_UNIT.exec(normalized);

  if (!match) {
    throw new Error(`Unsupported displayed dashboard value: ${JSON.stringify(value)}`);
  }

  const [, numberText, unit] = match;
  const factor = millisecondsByUnit[unit.toLowerCase()];

  if (factor === undefined) {
    throw new Error(`Unsupported displayed dashboard value: ${JSON.stringify(value)}`);
  }

  return normalizeDisplayedNumber(numberText) * factor;
}

export function displayedPercentToRatio(value: string): number {
  const normalized = value.trim().replace('−', '-');
  const match = new RegExp(String.raw`^(${DISPLAYED_NUMBER})\s*%$`).exec(normalized);

  if (!match) {
    throw new Error(`Unsupported displayed percentage: ${JSON.stringify(value)}`);
  }

  return normalizeDisplayedNumber(match[1]) / 100;
}

export function displayedDurationToMilliseconds(value: string): number {
  return parseDisplayedValueWithUnit(value, GRAFANA_MILLISECONDS_BY_UNIT);
}

export function displayedFrequencyToMilliseconds(value: string): number {
  return parseDisplayedValueWithUnit(value, GRAFANA_MILLISECONDS_BY_UNIT);
}

export function displayedCertificateDurationToSeconds(value: string): number {
  return parseDisplayedValueWithUnit(value, GRAFANA_SECONDS_BY_UNIT);
}
