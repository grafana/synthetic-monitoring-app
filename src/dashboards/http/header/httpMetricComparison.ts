import { FieldType, type PanelData } from '@grafana/data';

import type {
  HeaderMetricComparisonCopy,
  HeaderMetricComparisonInput,
} from 'dashboards/components/CheckDashboardHeader/CheckDashboardHeader.types';
import { formatDuration } from 'utils';

type NumericComparisonInput = Pick<HeaderMetricComparisonInput, 'primary' | 'reference' | 'referenceLabel'> &
  Partial<Pick<HeaderMetricComparisonInput, 'primaryDurationMs' | 'referenceDurationMs' | 'referenceKind'>>;

type SslComparisonInput = Pick<
  HeaderMetricComparisonInput,
  'primary' | 'reference' | 'referenceLabel' | 'primaryData' | 'referenceData'
> &
  Partial<Pick<HeaderMetricComparisonInput, 'primaryDurationMs' | 'referenceDurationMs' | 'referenceKind'>>;

interface SslObservation {
  remaining: number;
  identity?: string;
  expiry?: number;
  observedAt?: number;
}

const DAY_SECONDS = 86_400;
const EXPIRY_TIME_TOLERANCE_MS = 60_000;
const RENEWAL_MOVEMENT_MS = 86_400_000;

const CERTIFICATE_IDENTITY_KEYS = new Set([
  'certificatefingerprint',
  'certificateidentity',
  'certificateserial',
  'certfingerprint',
  'certserial',
  'fingerprint',
  'fingerprintsha256',
  'sslcertificatefingerprint',
  'tlscertificatefingerprint',
]);

const CERTIFICATE_EXPIRY_KEYS = new Set([
  'certificateexpiry',
  'certificateexpiresat',
  'certificatenotafter',
  'certexpiry',
  'certexpiresat',
  'certnotafter',
  'expiry',
  'expiresat',
  'notafter',
]);

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function appendUnequalDurations(detail: string, input: NumericComparisonInput): string {
  const { primaryDurationMs, referenceDurationMs, referenceLabel } = input;

  if (
    input.referenceKind === 'normal' ||
    !isFiniteNumber(primaryDurationMs) ||
    !isFiniteNumber(referenceDurationMs) ||
    primaryDurationMs < 0 ||
    referenceDurationMs < 0 ||
    primaryDurationMs === referenceDurationMs
  ) {
    return detail;
  }

  return `${detail} · Current range: ${formatDuration(primaryDurationMs)} · ${referenceLabel} range: ${formatDuration(
    referenceDurationMs
  )}`;
}

export function comparePercentagePoints(input: NumericComparisonInput): HeaderMetricComparisonCopy | null {
  const { primary, reference, referenceLabel } = input;

  if (!isFiniteNumber(primary) || !isFiniteNumber(reference)) {
    return null;
  }

  const difference = (primary - reference) * 100;
  const displayedDifference = Math.abs(difference).toFixed(1);
  const summary =
    Number(displayedDifference) === 0
      ? `In line with ${referenceLabel}`
      : `${displayedDifference} pp ${difference > 0 ? 'higher' : 'lower'} than ${referenceLabel}`;
  const detail = `${(primary * 100).toFixed(2)}% now · ${(reference * 100).toFixed(2)}% reference`;

  return {
    summary,
    detail: appendUnequalDurations(detail, input),
  };
}

export function compareLatency(input: NumericComparisonInput): HeaderMetricComparisonCopy | null {
  const { primary, reference, referenceLabel } = input;

  if (!isFiniteNumber(primary) || !isFiniteNumber(reference)) {
    return null;
  }

  const difference = primary - reference;
  const displayedDifference = Math.abs(difference).toFixed(2);
  const referenceSummary = `${
    input.referenceKind === 'normal' || (input.referenceKind === undefined && referenceLabel === 'Normal')
      ? `${referenceLabel} median`
      : `${referenceLabel} average`
  } ${reference.toFixed(2)} s`;

  if (Number(displayedDifference) === 0) {
    return {
      summary: `In line with ${referenceLabel}`,
      detail: appendUnequalDurations(referenceSummary, input),
    };
  }

  const direction = difference > 0 ? 'slower' : 'faster';
  const relativePercentage =
    reference === 0 ? undefined : Math.round((Math.abs(difference) / Math.abs(reference)) * 100);
  const relativeCopy =
    relativePercentage === undefined
      ? 'Relative change unavailable from a zero reference'
      : `${relativePercentage === 0 ? '<1' : relativePercentage}% ${direction}`;
  const detail = `${relativeCopy} · ${referenceSummary}`;

  return {
    summary: `${displayedDifference} s ${direction} than ${referenceLabel}`,
    detail: appendUnequalDurations(detail, input),
  };
}

function normalizedMetadataKey(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
}

function associatedMetadataValue(
  frame: PanelData['series'][number],
  selectedField: PanelData['series'][number]['fields'][number],
  selectedIndex: number,
  keys: Set<string>
): unknown {
  const associatedFields = [selectedField, ...frame.fields.filter((field) => field !== selectedField)];

  for (const field of associatedFields) {
    for (const [label, value] of Object.entries(field.labels ?? {})) {
      if (keys.has(normalizedMetadataKey(label)) && value !== '') {
        return value;
      }
    }
  }

  for (const field of associatedFields) {
    if (keys.has(normalizedMetadataKey(field.name))) {
      const value = field.values[selectedIndex];

      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }
  }

  return undefined;
}

function associatedObservationTimestamp(frame: PanelData['series'][number], selectedIndex: number): number | undefined {
  for (let fieldIndex = frame.fields.length - 1; fieldIndex >= 0; fieldIndex--) {
    const field = frame.fields[fieldIndex]!;

    if (field.type === FieldType.time) {
      const timestamp = absoluteTimestamp(field.values[selectedIndex]);

      if (timestamp !== undefined) {
        return timestamp;
      }
    }
  }

  return undefined;
}

function selectSslObservation(data: PanelData, fallbackRemaining: number): SslObservation {
  for (let frameIndex = data.series.length - 1; frameIndex >= 0; frameIndex--) {
    const frame = data.series[frameIndex]!;

    for (let fieldIndex = frame.fields.length - 1; fieldIndex >= 0; fieldIndex--) {
      const field = frame.fields[fieldIndex]!;

      if (field.type !== FieldType.number) {
        continue;
      }

      for (let valueIndex = field.values.length - 1; valueIndex >= 0; valueIndex--) {
        const remaining = field.values[valueIndex];

        if (!isFiniteNumber(remaining)) {
          continue;
        }

        const identityValue = associatedMetadataValue(frame, field, valueIndex, CERTIFICATE_IDENTITY_KEYS);
        const identity =
          typeof identityValue === 'string' || typeof identityValue === 'number' ? String(identityValue) : undefined;
        const expiry = absoluteTimestamp(associatedMetadataValue(frame, field, valueIndex, CERTIFICATE_EXPIRY_KEYS));

        return {
          remaining,
          identity,
          expiry,
          observedAt: associatedObservationTimestamp(frame, valueIndex),
        };
      }
    }
  }

  return { remaining: fallbackRemaining };
}

function absoluteTimestamp(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 10_000_000_000 ? value * 1000 : value;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function certificateExpiry(observation: SslObservation): number | undefined {
  if (observation.expiry !== undefined) {
    return observation.expiry;
  }

  return observation.observedAt === undefined ? undefined : observation.observedAt + observation.remaining * 1000;
}

function formatCurrentExpiry(seconds: number): string {
  if (seconds < 0) {
    return `Expired ${formatRemainingMagnitude(seconds)} ago`;
  }

  if (seconds === 0) {
    return 'Expires now';
  }

  return `${formatRemainingMagnitude(seconds)} remaining now`;
}

function formatRemainingMagnitude(seconds: number): string {
  return Math.abs(seconds) >= DAY_SECONDS
    ? `${Math.floor(Math.abs(seconds) / DAY_SECONDS).toLocaleString()}d`
    : formatDuration(Math.abs(seconds) * 1000, true);
}

function formatExpiryMovement(milliseconds: number): string {
  const days = Math.round(Math.abs(milliseconds) / RENEWAL_MOVEMENT_MS);

  if (days >= 1) {
    return `${days.toLocaleString()} ${days === 1 ? 'day' : 'days'}`;
  }

  return formatDuration(Math.abs(milliseconds), true);
}

export function compareSslCertificate(input: SslComparisonInput): HeaderMetricComparisonCopy | null {
  const { primary, reference, primaryData, referenceData, referenceLabel } = input;

  if (!isFiniteNumber(primary) || !isFiniteNumber(reference)) {
    return null;
  }

  const primaryObservation = selectSslObservation(primaryData, primary);
  const referenceObservation = selectSslObservation(referenceData, reference);
  const primaryIdentity = primaryObservation.identity;
  const referenceIdentity = referenceObservation.identity;
  const comparableIdentity = primaryIdentity !== undefined && referenceIdentity !== undefined;
  const sameIdentity = comparableIdentity && primaryIdentity === referenceIdentity;
  const identityDetail = sameIdentity ? 'Same certificate' : 'certificate identity unavailable';

  if (primaryObservation.remaining < 0) {
    const expiredIdentityDetail =
      comparableIdentity && primaryIdentity !== referenceIdentity ? 'Certificate identity changed' : identityDetail;

    return {
      summary: 'Certificate expired',
      detail: appendUnequalDurations(
        `${formatCurrentExpiry(primaryObservation.remaining)} · ${expiredIdentityDetail}`,
        input
      ),
    };
  }

  if (comparableIdentity && primaryIdentity !== referenceIdentity) {
    return {
      summary: 'Certificate renewed',
      detail: appendUnequalDurations(`Certificate identity changed since ${referenceLabel}`, input),
    };
  }

  const primaryExpiry = certificateExpiry(primaryObservation);
  const referenceExpiry = certificateExpiry(referenceObservation);
  const expiryMovement =
    primaryExpiry !== undefined && referenceExpiry !== undefined ? primaryExpiry - referenceExpiry : undefined;

  if (expiryMovement !== undefined && expiryMovement < -EXPIRY_TIME_TOLERANCE_MS) {
    return {
      summary: 'Certificate expiry moved earlier',
      detail: appendUnequalDurations(
        `${identityDetail} · expiry moved ${formatExpiryMovement(expiryMovement)} earlier`,
        input
      ),
    };
  }

  const remainingMovementMs = (primaryObservation.remaining - referenceObservation.remaining) * 1000;
  const forwardMovement =
    expiryMovement !== undefined ? expiryMovement >= RENEWAL_MOVEMENT_MS : remainingMovementMs >= RENEWAL_MOVEMENT_MS;

  if (forwardMovement) {
    const movement = expiryMovement ?? remainingMovementMs;

    return {
      summary: sameIdentity ? 'Certificate expiry extended' : 'Certificate likely renewed',
      detail: appendUnequalDurations(
        sameIdentity
          ? `${identityDetail} · expiry moved ${formatExpiryMovement(movement)} later`
          : `Expiry moved ${formatExpiryMovement(movement)} later · ${identityDetail}`,
        input
      ),
    };
  }

  return {
    summary: 'Expiry progressing as expected',
    detail: appendUnequalDurations(
      sameIdentity
        ? `${identityDetail} · ${formatCurrentExpiry(primaryObservation.remaining)}`
        : `${formatCurrentExpiry(primaryObservation.remaining)} · ${identityDetail}`,
      input
    ),
  };
}
