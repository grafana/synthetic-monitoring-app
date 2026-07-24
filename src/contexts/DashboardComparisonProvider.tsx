import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import { FieldType, type PanelData } from '@grafana/data';
import {
  classifyManualCoverage,
  type ManualReferenceAvailability,
  type NormalReference,
  selectNormalReference,
} from 'dashboards/comparison/comparisonCoverage';
import {
  BASELINE_COMPARISON_PRESETS,
  SAME_PERIOD_COMPARISON_PRESETS,
} from 'dashboards/comparison/comparisonPresets';
import { resolveComparisonReference } from 'dashboards/comparison/resolveComparisonReference';
import {
  type AutomaticComparisonState,
  useAutoComparisonReference,
} from 'dashboards/comparison/useAutoComparisonReference';
import {
  type DashboardPanelDefinition,
  useDashboardPanelQuery,
} from 'dashboards/hooks/useDashboardPanelQuery';
import { hasPanelDataQueryError } from 'dashboards/query/panelDataQueryState';

import {
  type ComparisonRange,
  type ComparisonReferenceSpec,
  type ExplicitComparisonReferenceSpec,
  type ResolvedDisplayReference,
} from 'dashboards/comparison/comparisonReference.types';
import { type Check } from 'types';
import {
  type DashboardUrlState,
  mergeDashboardUrlState,
  parseDashboardUrl,
  withDashboardUrlState,
  withLegacyDashboardUrlState,
} from 'routing/dashboardUrl';
import { transformLegacySceneDashboardUrl } from 'routing/legacySceneDashboardUrl';

import { useAppTime } from './AppTimeProvider';
import { type DashboardUrlFormat, useCheckDashboard } from './CheckDashboardProvider';

const DAY_MS = 24 * 60 * 60 * 1000;
const NORMAL_LOOKBACK_MS = 30 * DAY_MS;

export interface DashboardComparisonContextValue {
  enabled: boolean;
  referenceSpec: ComparisonReferenceSpec | null;
  healthReference: NormalReference;
  displayReference: ResolvedDisplayReference | null;
  displayAvailability: ManualReferenceAvailability | null;
  automaticSelection: AutomaticComparisonState;
  setEnabled: (enabled: boolean) => void;
  setReference: (reference: ComparisonReferenceSpec | null) => void;
  retryAutomaticSelection: () => void;
}

export interface CheckDashboardComparisonProfile<TCheck extends Check> {
  createExecutionPresenceDefinition: (check: TCheck) => DashboardPanelDefinition;
  getKnownRetentionBoundary?: (check: TCheck) => number | undefined;
}

interface ComparisonAvailabilityContextValue {
  primary: ComparisonRange;
  timezone: string;
  presenceDefinition: DashboardPanelDefinition;
  knownRetentionBoundary?: number;
}

const disabledValue: DashboardComparisonContextValue = {
  enabled: false,
  referenceSpec: null,
  healthReference: { status: 'not-established' },
  displayReference: null,
  displayAvailability: null,
  automaticSelection: { status: 'inactive' },
  setEnabled: () => undefined,
  setReference: () => undefined,
  retryAutomaticSelection: () => undefined,
};

const DashboardComparisonContext = createContext<DashboardComparisonContextValue | null>(null);
const ComparisonAvailabilityContext = createContext<ComparisonAvailabilityContextValue | null>(null);

export function DashboardComparisonProvider<TCheck extends Check>({
  check,
  profile,
  children,
}: PropsWithChildren<{
  check: TCheck;
  profile?: CheckDashboardComparisonProfile<TCheck>;
}>) {
  if (!profile) {
    return (
      <DashboardComparisonContext.Provider value={disabledValue}>
        {children}
      </DashboardComparisonContext.Provider>
    );
  }

  return (
    <DashboardComparisonUrlGuard check={check} profile={profile}>
      {children}
    </DashboardComparisonUrlGuard>
  );
}

function DashboardComparisonUrlGuard<TCheck extends Check>({
  check,
  profile,
  children,
}: PropsWithChildren<{
  check: TCheck;
  profile: CheckDashboardComparisonProfile<TCheck>;
}>) {
  const location = useLocation();
  const { urlFormat } = useCheckDashboard();
  const urlState = readUrlState(new URLSearchParams(location.search), urlFormat);

  if (!urlState) {
    return (
      <DashboardComparisonContext.Provider value={disabledValue}>
        {children}
      </DashboardComparisonContext.Provider>
    );
  }

  return (
    <ActiveDashboardComparisonProvider
      check={check}
      location={location}
      profile={profile}
      urlFormat={urlFormat}
      urlState={urlState}
    >
      {children}
    </ActiveDashboardComparisonProvider>
  );
}

function ActiveDashboardComparisonProvider<TCheck extends Check>({
  check,
  location,
  profile,
  urlFormat,
  urlState,
  children,
}: PropsWithChildren<{
  check: TCheck;
  location: ReturnType<typeof useLocation>;
  profile: CheckDashboardComparisonProfile<TCheck>;
  urlFormat: DashboardUrlFormat;
  urlState: DashboardUrlState;
}>) {
  const navigate = useNavigate();
  const { absolute: primary, timezone } = useAppTime();
  const presenceDefinition = useMemo(
    () => profile.createExecutionPresenceDefinition(check),
    [check, profile]
  );
  const knownRetentionBoundary = profile.getKnownRetentionBoundary?.(check);
  const referenceSpec = urlState.comparison ?? null;
  const enabled = referenceSpec !== null && urlState.comparisonEnabled !== false;
  const normalRange = useMemo(
    () => ({
      from: primary.from - NORMAL_LOOKBACK_MS,
      to: primary.from,
    }),
    [primary.from]
  );
  const normalQuery = useDashboardPanelQuery(presenceDefinition, { range: normalRange });
  const healthReference = useMemo<NormalReference>(() => {
    if (hasPanelDataQueryError(normalQuery.panelData)) {
      return { status: 'query-error' };
    }

    if (normalQuery.isLoading) {
      return { status: 'checking' };
    }

    return selectNormalReference(panelDataToPresenceSamples(normalQuery.panelData), primary.from);
  }, [normalQuery.isLoading, normalQuery.panelData, primary.from]);
  const availabilityContext = useMemo<ComparisonAvailabilityContextValue>(
    () => ({
      primary,
      timezone,
      presenceDefinition,
      knownRetentionBoundary,
    }),
    [knownRetentionBoundary, presenceDefinition, primary, timezone]
  );

  return (
    <ComparisonAvailabilityContext.Provider value={availabilityContext}>
      <ComparisonValue
        enabled={enabled}
        healthReference={healthReference}
        location={location}
        navigate={navigate}
        referenceSpec={referenceSpec}
        urlFormat={urlFormat}
      >
        {children}
      </ComparisonValue>
    </ComparisonAvailabilityContext.Provider>
  );
}

function ComparisonValue({
  enabled,
  healthReference,
  location,
  navigate,
  referenceSpec,
  urlFormat,
  children,
}: PropsWithChildren<{
  enabled: boolean;
  healthReference: NormalReference;
  location: ReturnType<typeof useLocation>;
  navigate: ReturnType<typeof useNavigate>;
  referenceSpec: ComparisonReferenceSpec | null;
  urlFormat: DashboardUrlFormat;
}>) {
  const availabilityContext = useContext(ComparisonAvailabilityContext)!;
  const commitComparison = useCallback(
    (comparison: ComparisonReferenceSpec | null, comparisonEnabled?: boolean) => {
      const current = readUrlState(new URLSearchParams(location.search), urlFormat);

      if (!current) {
        return;
      }

      const nextState = mergeDashboardUrlState(current, { comparison, comparisonEnabled });
      const nextPath =
        urlFormat === 'canonical'
          ? withDashboardUrlState(
              location.pathname,
              nextState,
              new URLSearchParams(location.search),
              'canonical'
            )
          : withLegacyDashboardUrlState(
              location.pathname,
              nextState,
              new URLSearchParams(location.search)
            );
      const queryIndex = nextPath.indexOf('?');

      navigate(
        {
          pathname: location.pathname,
          search: queryIndex >= 0 ? nextPath.slice(queryIndex) : '',
        },
        { replace: true }
      );
    },
    [location.pathname, location.search, navigate, urlFormat]
  );
  const [retryToken, retryAutomaticSelection] = useReducer((current: number) => current + 1, 0);
  const automaticEnabled = enabled && referenceSpec?.kind === 'auto';
  const automaticResult = useAutoComparisonReference({
    definition: availabilityContext.presenceDefinition,
    enabled: automaticEnabled,
    knownRetentionBoundary: availabilityContext.knownRetentionBoundary,
    primary: availabilityContext.primary,
    retryToken,
    timezone: availabilityContext.timezone,
  });
  const explicitReference: ExplicitComparisonReferenceSpec | null =
    referenceSpec?.kind === 'auto' || referenceSpec === null ? null : referenceSpec;
  const explicitAvailability = useComparisonReferenceAvailability(
    explicitReference ?? { kind: 'previous' },
    enabled && explicitReference !== null
  );
  const displayReference = useMemo(
    () =>
      resolveDisplayReference(
        explicitReference,
        availabilityContext.primary,
        availabilityContext.timezone
      ),
    [availabilityContext.primary, availabilityContext.timezone, explicitReference]
  );
  const displayAvailability = enabled && explicitReference ? explicitAvailability : null;

  useEffect(() => {
    if (!automaticEnabled || !automaticResult.resolvedReference) {
      return;
    }

    commitComparison(automaticResult.resolvedReference, true);
  }, [automaticEnabled, automaticResult.resolvedReference, commitComparison]);

  const setEnabled = useCallback(
    (nextEnabled: boolean) => {
      commitComparison(nextEnabled ? referenceSpec ?? { kind: 'auto' } : referenceSpec, nextEnabled);
    },
    [commitComparison, referenceSpec]
  );
  const setReference = useCallback(
    (reference: ComparisonReferenceSpec | null) => {
      commitComparison(reference, reference ? true : undefined);
    },
    [commitComparison]
  );
  const value = useMemo<DashboardComparisonContextValue>(
    () => ({
      enabled,
      referenceSpec,
      healthReference,
      displayReference,
      displayAvailability,
      automaticSelection: automaticEnabled
        ? automaticResult.automaticSelection
        : { status: 'inactive' },
      setEnabled,
      setReference,
      retryAutomaticSelection,
    }),
    [
      displayAvailability,
      displayReference,
      enabled,
      healthReference,
      referenceSpec,
      automaticEnabled,
      automaticResult.automaticSelection,
      retryAutomaticSelection,
      setEnabled,
      setReference,
    ]
  );

  return (
    <DashboardComparisonContext.Provider value={value}>
      {children}
    </DashboardComparisonContext.Provider>
  );
}

export function useComparisonReferenceAvailability(
  reference: ExplicitComparisonReferenceSpec,
  enabled: boolean
): ManualReferenceAvailability {
  const context = useContext(ComparisonAvailabilityContext);

  if (!context) {
    throw new Error(
      'useComparisonReferenceAvailability must be used within a DashboardComparisonProvider'
    );
  }

  const resolution = resolveComparisonReference(reference, context.primary, context.timezone);
  const queryEnabled = enabled && resolution.status === 'valid';
  const query = useDashboardPanelQuery(context.presenceDefinition, {
    range: resolution.status === 'valid' ? resolution.range : context.primary,
    enabled: queryEnabled,
  });

  if (resolution.status === 'invalid') {
    return { status: resolution.reason };
  }

  if (!enabled) {
    return { status: 'checking' };
  }

  if (hasPanelDataQueryError(query.panelData)) {
    return { status: 'query-error' };
  }

  if (query.isLoading) {
    return { status: 'checking' };
  }

  return classifyManualCoverage(
    panelDataToPresenceSamples(query.panelData),
    resolution.range,
    context.knownRetentionBoundary
  );
}

export function useDashboardComparison(): DashboardComparisonContextValue {
  const context = useContext(DashboardComparisonContext);

  if (!context) {
    throw new Error('useDashboardComparison must be used within a DashboardComparisonProvider');
  }

  return context;
}

function readUrlState(
  search: URLSearchParams,
  urlFormat: DashboardUrlFormat
): DashboardUrlState | null {
  if (urlFormat === 'canonical') {
    const parsed = parseDashboardUrl(search);

    return parsed.ok ? transformLegacySceneDashboardUrl(search) : null;
  }

  return transformLegacySceneDashboardUrl(search);
}

function resolveDisplayReference(
  spec: ExplicitComparisonReferenceSpec | null,
  primary: ComparisonRange,
  timezone: string
): ResolvedDisplayReference | null {
  if (!spec) {
    return null;
  }

  const resolution = resolveComparisonReference(spec, primary, timezone);
  const label = getExplicitReferenceLabel(spec);

  if (resolution.status === 'invalid') {
    return {
      status: 'invalid',
      spec,
      label,
      reason: resolution.reason,
    };
  }

  return {
    status: 'valid',
    spec,
    label,
    range: resolution.range,
    equalDuration: resolution.equalDuration,
  };
}

function getExplicitReferenceLabel(spec: ExplicitComparisonReferenceSpec): string {
  if (spec.kind === 'previous') {
    return 'Previous period';
  }

  if (spec.kind === 'custom') {
    return 'Custom range';
  }

  const presets =
    spec.kind === 'baseline' ? BASELINE_COMPARISON_PRESETS : SAME_PERIOD_COMPARISON_PRESETS;

  return presets.find(({ id }) => id === spec.presetId)?.label ?? spec.presetId;
}

function valuesToArray(values: ArrayLike<unknown> | { toArray: () => unknown[] }): unknown[] {
  return typeof (values as { toArray?: () => unknown[] }).toArray === 'function'
    ? (values as { toArray: () => unknown[] }).toArray()
    : Array.from(values as ArrayLike<unknown>);
}

function panelDataToPresenceSamples(
  data: PanelData
): Array<{ at: number; value: number }> {
  return data.series.flatMap((frame) => {
    const timeField = frame.fields.find(
      (field) => field.type === FieldType.time || field.name.toLowerCase() === 'time'
    );
    const valueField = frame.fields.find((field) => field.type === FieldType.number);

    if (!timeField || !valueField) {
      return [];
    }

    const times = valuesToArray(timeField.values);
    const values = valuesToArray(valueField.values);

    return times.flatMap((at, index) => {
      const value = values[index];

      return typeof at === 'number' &&
        Number.isFinite(at) &&
        typeof value === 'number' &&
        Number.isFinite(value)
        ? [{ at, value }]
        : [];
    });
  });
}
