import { WEB_VITAL_CONFIG, WebVitalName, WebVitalScore, WebVitalUnit, WebVitalValueConfig } from './types';

function getWebVitalScore(name: WebVitalName, value: number | null): WebVitalScore | undefined {
  const thresholds = WEB_VITAL_CONFIG[name]?.thresholds;

  if (!thresholds || value === null) {
    return undefined;
  }

  const [good, poor] = thresholds;

  if (good >= value) {
    return 'good';
  }

  if (poor < value) {
    return 'poor';
  }

  return 'needs_improvement';
}

export function getWebVitalValueConfig(name: WebVitalName, value: undefined | number | null = null): WebVitalValueConfig {
  const config = WEB_VITAL_CONFIG[name];
  if (!config) {
    throw new TypeError(`Unknown web vital name: ${name}`);
  }
  const score = getWebVitalScore(name, value);
  const unit = config.unit;
  const formattedValue = webVitalFormatter(value, unit);
  const thresholds = config.thresholds;

  return {
    name,
    value: formattedValue,
    score,
    unitType: unit,
    unit: getPresentationUnit(unit),
    originalValue: value,
    thresholds,
    toString() {
      return getWebVitalValueString(this);
    },
  };
}

export function getWebVitalValueString(value: WebVitalValueConfig) {
  if (value.originalValue === null) {
    return '-';
  }
  if (value.unitType === 'score') {
    return value.value.toString();
  }

  return `${value.value}${value.unit}`;
}

export function webVitalFormatter(value: number | null, unit: WebVitalUnit) {
  if (value === null) {
    return '-';
  }

  switch (unit) {
    case 'milliseconds':
      return value.toFixed(0);
    case 'seconds':
      return (value > 0 ? value / 1000 : 0).toFixed(2);
    case 'score':
      return value.toFixed(2);
    default:
      return unit;
  }
}

function getPresentationUnit(unit: WebVitalValueConfig['unitType']) {
  switch (unit) {
    case 'seconds':
      return 's';
    case 'milliseconds':
      return 'ms';
    case 'score':
      return '';
    default:
      return unit;
  }
}
