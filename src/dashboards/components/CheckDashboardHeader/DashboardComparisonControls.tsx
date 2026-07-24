import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dateTimeForTimeZone, dateTimeParse, type GrafanaTheme2 } from '@grafana/data';
import { type TimeZone } from '@grafana/schema';
import { Button, Dropdown, Field, InlineSwitch, Input, Menu, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { type ManualReferenceAvailability, type NormalReference } from 'dashboards/comparison/comparisonCoverage';
import { COMPARISON_PRESETS } from 'dashboards/comparison/comparisonPresets';
import { resolveComparisonReference, setLockedCustomBoundary } from 'dashboards/comparison/resolveComparisonReference';

import {
  type ComparisonRange,
  type ComparisonReferenceSpec,
  type ManualComparisonReferenceSpec,
} from 'dashboards/comparison/comparisonReference.types';
import { useAppTime } from 'contexts/AppTimeProvider';
import { useComparisonReferenceAvailability, useDashboardComparison } from 'contexts/DashboardComparisonProvider';

const DATETIME_LOCAL_FORMAT = 'YYYY-MM-DDTHH:mm';
const DISPLAY_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS Z';
const WALL_TIME_SEARCH_STEP_MS = 30 * 60 * 1000;
const WALL_TIME_SEARCH_RADIUS_MS = 3 * 60 * 60 * 1000;
const MATCH_PRIMARY_DURATION_ID = 'comparison-match-primary-duration';
const CUSTOM_FROM_ERROR_ID = 'comparison-custom-from-error';
const CUSTOM_TO_ERROR_ID = 'comparison-custom-to-error';
const CUSTOM_RANGE_ERROR_ID = 'comparison-custom-range-error';

type Availability = ManualReferenceAvailability | NormalReference;

interface CustomDraft {
  fromLocal: string;
  toLocal: string;
  matchPrimaryDuration: boolean;
}

interface ResolvedLocalDateTime {
  iso: string;
  offset: string;
  timestamp: number;
}

interface CandidateAvailabilityStatus {
  description: string;
  label: string;
  status: ManualReferenceAvailability['status'];
}

export function toAbsoluteIso(localValue: string, timezone: string): string | null {
  return resolveLocalDateTime(localValue, timezone)?.iso ?? null;
}

function resolveLocalDateTime(localValue: string, timezone: string): ResolvedLocalDateTime | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localValue)) {
    return null;
  }

  const parsed = dateTimeParse(localValue, {
    format: DATETIME_LOCAL_FORMAT,
    timeZone: timezone as TimeZone,
  });

  if (!parsed?.isValid()) {
    return null;
  }

  const candidates: number[] = [];

  for (
    let delta = -WALL_TIME_SEARCH_RADIUS_MS;
    delta <= WALL_TIME_SEARCH_RADIUS_MS;
    delta += WALL_TIME_SEARCH_STEP_MS
  ) {
    const candidate = parsed.valueOf() + delta;

    if (formatLocalDateTime(candidate, timezone) === localValue) {
      candidates.push(candidate);
    }
  }

  const timestamp = Math.min(...candidates);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return {
    iso: new Date(timestamp).toISOString(),
    offset: dateTimeForTimeZone(timezone as TimeZone, timestamp).format('Z'),
    timestamp,
  };
}

export function applyCustomReference({
  fromLocal,
  toLocal,
  timezone,
  matchPrimaryDuration,
  setReference,
}: {
  fromLocal: string;
  toLocal: string;
  timezone: string;
  matchPrimaryDuration: boolean;
  setReference: (reference: ComparisonReferenceSpec) => void;
}): boolean {
  const from = toAbsoluteIso(fromLocal, timezone);
  const to = toAbsoluteIso(toLocal, timezone);

  if (!from || !to) {
    return false;
  }

  setReference({
    kind: 'custom',
    from,
    to,
    matchPrimaryDuration,
  });

  return true;
}

export function DashboardComparisonControls() {
  const styles = useStyles2(getStyles);
  const appTime = useAppTime();
  const { displayAvailability, enabled, healthReference, referenceSpec, setEnabled, setReference } =
    useDashboardComparison();
  const [menuOpen, setMenuOpen] = useState(false);
  const [candidateAvailability, setCandidateAvailability] = useState<Record<string, CandidateAvailabilityStatus>>({});
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState<CustomDraft>(() =>
    createCustomDraft(referenceSpec, appTime.absolute, appTime.timezone)
  );
  const previousReferenceIdentity = useRef(comparisonReferenceIdentity(referenceSpec));
  const primaryDurationMs = appTime.absolute.to - appTime.absolute.from;
  const selectedLabel = referenceLabel(referenceSpec, healthReference);
  const selectedStatus = displayAvailability ? availabilityDescription(displayAvailability) : '';
  const candidateAnnouncement = useMemo(
    () => describeCandidateAvailability(menuOpen, candidateAvailability),
    [candidateAvailability, menuOpen]
  );
  const customResolution = useMemo(
    () => ({
      from: resolveLocalDateTime(customDraft.fromLocal, appTime.timezone),
      to: resolveLocalDateTime(customDraft.toLocal, appTime.timezone),
    }),
    [appTime.timezone, customDraft.fromLocal, customDraft.toLocal]
  );
  const customValidation = useMemo(
    () => validateCustomDraft(customDraft, appTime.absolute, appTime.timezone),
    [appTime.absolute, appTime.timezone, customDraft]
  );
  const customError = customValidation.status === 'invalid' ? validationReason(customValidation.reason) : undefined;
  const customFromError = customResolution.from ? undefined : 'Enter a valid custom start';
  const customToError = customResolution.to ? undefined : 'Enter a valid custom end';
  const customRangeError = customResolution.from && customResolution.to ? customError : undefined;
  const customFromInvalid = Boolean(customFromError || customRangeError);
  const customToInvalid = Boolean(customToError || customRangeError);
  const handleMenuVisibleChange = useCallback((open: boolean) => {
    setMenuOpen(open);
    setCandidateAvailability({});
  }, []);
  const reportCandidateAvailability = useCallback((key: string, next: CandidateAvailabilityStatus) => {
    setCandidateAvailability((current) => {
      const previous = current[key];

      if (
        previous?.description === next.description &&
        previous.label === next.label &&
        previous.status === next.status
      ) {
        return current;
      }

      return { ...current, [key]: next };
    });
  }, []);
  const resetCustomEditor = useCallback(() => {
    setCustomOpen(false);
    setCustomDraft(createCustomDraft(null, appTime.absolute, appTime.timezone));
  }, [appTime.absolute, appTime.timezone]);
  const selectReference = useCallback(
    (reference: ComparisonReferenceSpec) => {
      setReference(reference);

      if (reference.kind !== 'custom') {
        resetCustomEditor();
      }
    },
    [resetCustomEditor, setReference]
  );

  useEffect(() => {
    if (!enabled && customOpen) {
      resetCustomEditor();
    }
  }, [customOpen, enabled, resetCustomEditor]);

  const currentReferenceIdentity = comparisonReferenceIdentity(referenceSpec);

  useEffect(() => {
    const referenceChanged = previousReferenceIdentity.current !== currentReferenceIdentity;

    previousReferenceIdentity.current = currentReferenceIdentity;

    if (customOpen && referenceChanged && referenceSpec?.kind !== 'custom') {
      resetCustomEditor();
    }
  }, [currentReferenceIdentity, customOpen, referenceSpec?.kind, resetCustomEditor]);

  useEffect(() => {
    if (!customOpen) {
      return;
    }

    setCustomDraft((current) => {
      if (!current.matchPrimaryDuration) {
        return current;
      }

      const from = resolveLocalDateTime(current.fromLocal, appTime.timezone);

      if (!from) {
        return current;
      }

      const toLocal = formatLocalDateTime(from.timestamp + primaryDurationMs, appTime.timezone);

      return toLocal === current.toLocal ? current : { ...current, toLocal };
    });
  }, [appTime.timezone, customOpen, primaryDurationMs]);

  const openCustomEditor = () => {
    setCustomDraft(createCustomDraft(referenceSpec, appTime.absolute, appTime.timezone));
    setCustomOpen(true);
    setMenuOpen(false);
    setCandidateAvailability({});
  };

  const updateCustomBoundary = (boundary: 'from' | 'to', localValue: string) => {
    setCustomDraft((current) => {
      const next = {
        ...current,
        [boundary === 'from' ? 'fromLocal' : 'toLocal']: localValue,
      };

      if (!current.matchPrimaryDuration) {
        return next;
      }

      const timestamp = toAbsoluteTimestamp(localValue, appTime.timezone);

      if (timestamp === null) {
        return next;
      }

      const locked = setLockedCustomBoundary({
        boundary,
        value: timestamp,
        primaryDurationMs: appTime.absolute.to - appTime.absolute.from,
        current: draftToRange(current, appTime.timezone) ?? {
          from: timestamp,
          to: timestamp + (appTime.absolute.to - appTime.absolute.from),
        },
      });

      return {
        ...next,
        fromLocal: formatLocalDateTime(locked.from, appTime.timezone),
        toLocal: formatLocalDateTime(locked.to, appTime.timezone),
      };
    });
  };

  const applyCustom = () => {
    if (customValidation.status === 'invalid') {
      return;
    }

    const applied = applyCustomReference({
      ...customDraft,
      timezone: appTime.timezone,
      setReference: selectReference,
    });

    if (applied) {
      resetCustomEditor();
    }
  };

  return (
    <div className={styles.controls}>
      <div className={styles.selectorGroup}>
        <Button
          aria-pressed={enabled}
          fill={enabled ? 'solid' : 'outline'}
          onClick={() => {
            const nextEnabled = !enabled;

            if (!nextEnabled) {
              resetCustomEditor();
              setMenuOpen(false);
              setCandidateAvailability({});
            }

            setEnabled(nextEnabled);
          }}
          type="button"
          variant="secondary"
        >
          Compare
        </Button>
        {enabled && (
          <>
            <Dropdown
              onVisibleChange={handleMenuVisibleChange}
              overlay={
                <Menu ariaLabel="Comparison reference">
                  <Menu.Item
                    active={referenceSpec?.kind === 'normal'}
                    ariaChecked={referenceSpec?.kind === 'normal'}
                    ariaLabel={`Normal. ${availabilityDescription(healthReference)}`}
                    description={availabilityDescription(healthReference)}
                    disabled={!isSelectable(healthReference)}
                    icon={referenceSpec?.kind === 'normal' ? 'check' : undefined}
                    label="Normal"
                    onClick={() => {
                      selectReference({ kind: 'normal' });
                    }}
                    role="menuitemradio"
                  />
                  {menuOpen && (
                    <ManualReferenceMenuItem
                      label="Previous period"
                      onAvailability={reportCandidateAvailability}
                      onSelect={selectReference}
                      reference={{ kind: 'previous' }}
                      selected={referenceSpec?.kind === 'previous'}
                    />
                  )}
                  {menuOpen &&
                    COMPARISON_PRESETS.map((preset) => (
                      <ManualReferenceMenuItem
                        key={preset.id}
                        label={preset.label}
                        onAvailability={reportCandidateAvailability}
                        onSelect={selectReference}
                        reference={{ kind: 'shifted', presetId: preset.id }}
                        selected={referenceSpec?.kind === 'shifted' && referenceSpec.presetId === preset.id}
                      />
                    ))}
                  <Menu.Item
                    active={referenceSpec?.kind === 'custom'}
                    ariaChecked={referenceSpec?.kind === 'custom'}
                    icon={referenceSpec?.kind === 'custom' ? 'check' : undefined}
                    label="Custom range"
                    onClick={openCustomEditor}
                    role="menuitemradio"
                  />
                </Menu>
              }
              placement="bottom-start"
            >
              <Button
                aria-label={`Comparison reference, ${selectedLabel}`}
                fill="outline"
                type="button"
                variant="secondary"
              >
                {selectedLabel}
              </Button>
            </Dropdown>
            {selectedStatus && <span className={styles.status}>{selectedStatus}</span>}
          </>
        )}
      </div>
      <span aria-live="polite" className={styles.visuallyHidden} role="status">
        {selectedStatus === 'Checking availability' ? 'Checking comparison reference' : selectedStatus}
      </span>
      <span aria-live="polite" className={styles.visuallyHidden} data-testid="comparison-candidate-status">
        {candidateAnnouncement}
      </span>
      {enabled && customOpen && (
        <div className={styles.customEditor}>
          <div>
            <strong>Custom comparison range</strong>
            <div className={styles.excludedInterval}>
              Excluded primary interval: {formatDisplayDateTime(appTime.absolute.from, appTime.timezone)}
              {' – '}
              {formatDisplayDateTime(appTime.absolute.to, appTime.timezone)} ({appTime.timezone})
            </div>
            {customResolution.from && customResolution.to && (
              <div className={styles.resolvedInterval}>
                Resolved absolute range: {customResolution.from.iso} (UTC{customResolution.from.offset}){' – '}
                {customResolution.to.iso} (UTC{customResolution.to.offset})
              </div>
            )}
          </div>
          <div className={styles.customFields}>
            <Field
              error={customFromError ? <span id={CUSTOM_FROM_ERROR_ID}>{customFromError}</span> : undefined}
              htmlFor="comparison-custom-from"
              invalid={customFromInvalid}
              label="Custom range start"
            >
              <Input
                aria-describedby={
                  customFromError ? CUSTOM_FROM_ERROR_ID : customRangeError ? CUSTOM_RANGE_ERROR_ID : undefined
                }
                aria-invalid={customFromInvalid}
                id="comparison-custom-from"
                invalid={customFromInvalid}
                onChange={(event) => updateCustomBoundary('from', event.currentTarget.value)}
                type="datetime-local"
                value={customDraft.fromLocal}
              />
            </Field>
            <Field
              error={customToError ? <span id={CUSTOM_TO_ERROR_ID}>{customToError}</span> : undefined}
              htmlFor="comparison-custom-to"
              invalid={customToInvalid}
              label="Custom range end"
            >
              <Input
                aria-describedby={
                  customToError ? CUSTOM_TO_ERROR_ID : customRangeError ? CUSTOM_RANGE_ERROR_ID : undefined
                }
                aria-invalid={customToInvalid}
                id="comparison-custom-to"
                invalid={customToInvalid}
                onChange={(event) => updateCustomBoundary('to', event.currentTarget.value)}
                type="datetime-local"
                value={customDraft.toLocal}
              />
            </Field>
          </div>
          {customRangeError && (
            <div className={styles.status} id={CUSTOM_RANGE_ERROR_ID} role="alert">
              {customRangeError}
            </div>
          )}
          <InlineSwitch
            id={MATCH_PRIMARY_DURATION_ID}
            label="Match selected duration"
            onChange={(event) => {
              const checked = event.currentTarget.checked;

              setCustomDraft((current) => {
                if (!checked) {
                  return {
                    ...current,
                    matchPrimaryDuration: false,
                  };
                }

                const from = resolveLocalDateTime(current.fromLocal, appTime.timezone);

                return {
                  ...current,
                  matchPrimaryDuration: true,
                  toLocal: from
                    ? formatLocalDateTime(from.timestamp + primaryDurationMs, appTime.timezone)
                    : current.toLocal,
                };
              });
            }}
            showLabel
            value={customDraft.matchPrimaryDuration}
          />
          <div className={styles.customActions}>
            <Button disabled={Boolean(customError)} onClick={applyCustom} type="button" variant="primary">
              Apply custom range
            </Button>
            <Button fill="text" onClick={resetCustomEditor} type="button" variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManualReferenceMenuItem({
  label,
  onAvailability,
  onSelect,
  reference,
  selected,
}: {
  label: string;
  onAvailability: (key: string, availability: CandidateAvailabilityStatus) => void;
  onSelect: (reference: ComparisonReferenceSpec) => void;
  reference: ManualComparisonReferenceSpec;
  selected: boolean;
}) {
  const availability = useComparisonReferenceAvailability(reference, true);
  const description = availabilityDescription(availability);

  useEffect(() => {
    onAvailability(referenceKey(reference), {
      description,
      label,
      status: availability.status,
    });
  }, [availability.status, description, label, onAvailability, reference]);

  return (
    <Menu.Item
      active={selected}
      ariaChecked={selected}
      ariaLabel={`${label}. ${description}`}
      description={description}
      disabled={!isSelectable(availability)}
      icon={selected ? 'check' : undefined}
      label={label}
      onClick={() => onSelect(reference)}
      role="menuitemradio"
    />
  );
}

function describeCandidateAvailability(
  menuOpen: boolean,
  candidateAvailability: Record<string, CandidateAvailabilityStatus>
): string {
  if (!menuOpen) {
    return '';
  }

  const statuses = Object.values(candidateAvailability);
  const expectedCandidateCount = COMPARISON_PRESETS.length + 1;
  const checking = statuses.length < expectedCandidateCount || statuses.some(({ status }) => status === 'checking');
  const unavailable = statuses.filter(
    ({ status }) => status !== 'available' && status !== 'partial' && status !== 'checking'
  );

  if (checking) {
    return 'Checking comparison references';
  }

  if (unavailable.length > 0) {
    return `Unavailable comparison references: ${unavailable
      .map(({ description, label }) => `${label} — ${description}`)
      .join('; ')}`;
  }

  return 'Comparison references available';
}

function referenceKey(reference: ManualComparisonReferenceSpec): string {
  return reference.kind === 'shifted' ? reference.presetId : reference.kind;
}

function comparisonReferenceIdentity(reference: ComparisonReferenceSpec | null): string {
  if (!reference) {
    return 'off';
  }

  if (reference.kind === 'shifted') {
    return `shifted:${reference.presetId}`;
  }

  if (reference.kind === 'custom') {
    return `custom:${reference.from}:${reference.to}:${reference.matchPrimaryDuration}`;
  }

  return reference.kind;
}

function referenceName(reference: ComparisonReferenceSpec | null): string {
  if (!reference || reference.kind === 'normal') {
    return 'Normal';
  }

  if (reference.kind === 'previous') {
    return 'Previous period';
  }

  if (reference.kind === 'custom') {
    return 'Custom range';
  }

  return COMPARISON_PRESETS.find(({ id }) => id === reference.presetId)?.label ?? 'Unknown preset';
}

function referenceLabel(reference: ComparisonReferenceSpec | null, healthReference: NormalReference): string {
  if (!reference || reference.kind !== 'normal') {
    return referenceName(reference);
  }

  switch (healthReference.status) {
    case 'available':
      return `Normal · ${healthReference.tierId}`;
    case 'checking':
      return 'Normal · checking';
    case 'query-error':
      return 'Normal unavailable · query failed';
    case 'not-established':
      return 'Normal not established for this period';
  }
}

function isSelectable(availability: Availability): boolean {
  return availability.status === 'available' || availability.status === 'partial';
}

function availabilityDescription(availability: Availability): string {
  if (availability.status === 'available' || availability.status === 'partial') {
    return `${Math.round(availability.coverage * 100)}% coverage · ${Math.round(availability.executionCount).toLocaleString()} executions`;
  }

  switch (availability.status) {
    case 'checking':
      return 'Checking availability';
    case 'not-established':
      return 'Normal not established for this period';
    case 'outside-retention':
      return 'Outside retention';
    case 'no-retained-executions':
      return 'No retained executions';
    case 'query-error':
      return 'Availability check failed';
    case 'overlaps-primary':
      return 'Overlaps the selected primary interval';
    case 'unknown-preset':
      return 'Unknown comparison preset';
    case 'invalid-range':
      return 'Invalid comparison range';
  }
}

function createCustomDraft(
  reference: ComparisonReferenceSpec | null,
  primary: ComparisonRange,
  timezone: string
): CustomDraft {
  if (reference?.kind === 'custom') {
    const from = Date.parse(reference.from);
    const to = Date.parse(reference.to);

    if (Number.isFinite(from) && Number.isFinite(to)) {
      return {
        fromLocal: formatLocalDateTime(from, timezone),
        toLocal: formatLocalDateTime(to, timezone),
        matchPrimaryDuration: reference.matchPrimaryDuration,
      };
    }
  }

  const duration = primary.to - primary.from;

  return {
    fromLocal: formatLocalDateTime(primary.from - duration, timezone),
    toLocal: formatLocalDateTime(primary.from, timezone),
    matchPrimaryDuration: true,
  };
}

function validateCustomDraft(
  draft: CustomDraft,
  primary: ComparisonRange,
  timezone: string
): ReturnType<typeof resolveComparisonReference> {
  const from = toAbsoluteIso(draft.fromLocal, timezone);
  const to = toAbsoluteIso(draft.toLocal, timezone);

  if (!from || !to) {
    return { status: 'invalid', reason: 'invalid-range' };
  }

  return resolveComparisonReference(
    {
      kind: 'custom',
      from,
      to,
      matchPrimaryDuration: draft.matchPrimaryDuration,
    },
    primary,
    timezone
  );
}

function validationReason(reason: 'invalid-range' | 'overlaps-primary' | 'unknown-preset'): string {
  return reason === 'overlaps-primary'
    ? 'Custom range must not overlap the selected primary interval'
    : 'Enter a valid custom start and end';
}

function draftToRange(draft: CustomDraft, timezone: string): ComparisonRange | null {
  const from = toAbsoluteTimestamp(draft.fromLocal, timezone);
  const to = toAbsoluteTimestamp(draft.toLocal, timezone);

  return from === null || to === null ? null : { from, to };
}

function toAbsoluteTimestamp(localValue: string, timezone: string): number | null {
  return resolveLocalDateTime(localValue, timezone)?.timestamp ?? null;
}

function formatLocalDateTime(timestamp: number, timezone: string): string {
  return dateTimeForTimeZone(timezone as TimeZone, timestamp).format(DATETIME_LOCAL_FORMAT);
}

function formatDisplayDateTime(timestamp: number, timezone: string): string {
  return dateTimeForTimeZone(timezone as TimeZone, timestamp).format(DISPLAY_DATETIME_FORMAT);
}

const getStyles = (theme: GrafanaTheme2) => ({
  controls: css({
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  selectorGroup: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  status: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  customEditor: css({
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    maxWidth: theme.spacing(72),
    padding: theme.spacing(2),
  }),
  excludedInterval: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    marginTop: theme.spacing(0.5),
  }),
  resolvedInterval: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    marginTop: theme.spacing(0.5),
  }),
  customFields: css({
    display: 'grid',
    gap: theme.spacing(1),
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    [`@media (max-width: ${theme.breakpoints.values.sm}px)`]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  }),
  customActions: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
  }),
  visuallyHidden: css({
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: theme.spacing(0.125),
    margin: theme.spacing(-0.125),
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: theme.spacing(0.125),
  }),
});
