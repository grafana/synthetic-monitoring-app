import { ComponentType, PropsWithChildren } from 'react';
import { FieldSparkline, GrafanaTheme2, IconName, PanelData } from '@grafana/data';
import type { BaselineSample } from 'dashboards/components/CheckDashboardHeader/health/baseline';
import { DashboardPanelDefinition } from 'dashboards/hooks/useDashboardPanelQuery';

import type { ExplicitComparisonReferenceSpec } from 'dashboards/comparison/comparisonReference.types';
import { Check, CheckAlertType, Label } from 'types';
import { CheckDashboardComparisonProfile } from 'contexts/DashboardComparisonProvider';

export interface HeaderDefinitionFact {
  id: string;
  label: string;
  value: string;
  icon?: IconName;
  /**
   * Distinguishes setup configuration from a success/outcome fact so the header can group
   * config tokens separately from the result token. Defaults to 'config' when omitted.
   */
  kind?: 'config' | 'result';
}

export interface CheckHeaderMetaItem {
  id: string;
  label: string;
  value: string;
  title?: string;
  icon?: IconName;
}

export interface CheckHeaderStatus {
  label: string;
  running: boolean;
}

export interface CheckHeaderDefinitionModel {
  title: string;
  typeLabel: string;
  qualifier?: {
    text: string;
    getColor?: (theme: GrafanaTheme2) => string;
  };
  target?: {
    value: string;
    accessibleLabel: string;
  };
  facts: HeaderDefinitionFact[];
  labels: Label[];
  details?: {
    title: string;
    items: HeaderDefinitionFact[];
  };
}

export interface HeaderMetricDetailProps<TCheck extends Check = Check> {
  check: TCheck;
}

export interface HeaderMetricHealthCapability {
  alertTypes?: CheckAlertType[];
}

export interface HeaderMetricComparisonCopy {
  plain: string;
  compact: string;
  detail?: string;
}

export interface HeaderMetricComparisonInput {
  primary: number | null;
  reference: number | null;
  referenceKind: ExplicitComparisonReferenceSpec['kind'];
  referenceLabel: string;
  primaryDurationMs: number;
  referenceDurationMs: number;
  primaryData: PanelData;
  referenceData: PanelData;
}

export interface HeaderMetricComparisonCapability {
  normalBaseline?: {
    definition: DashboardPanelDefinition;
    selectSamples: (data: PanelData) => BaselineSample[];
  };
  compare: (input: HeaderMetricComparisonInput) => HeaderMetricComparisonCopy | null;
}

export interface HeaderMetricDefinition<TCheck extends Check = Check> {
  id: string;
  label: string;
  description: string;
  definition: DashboardPanelDefinition;
  selectValue: (data: PanelData) => number | null;
  formatValue: (value: number | null) => string;
  getSecondaryText?: (value: number | null) => string | undefined;
  secondary?: {
    definition: DashboardPanelDefinition;
    selectText: (data: PanelData) => string | undefined;
  };
  sparkline?: {
    definition: DashboardPanelDefinition;
    selectSeries: (data: PanelData) => FieldSparkline | null;
  };
  health?: HeaderMetricHealthCapability;
  comparison?: HeaderMetricComparisonCapability;
  Details?: ComponentType<HeaderMetricDetailProps<TCheck>>;
}

export interface HeaderNarrativeProps<TCheck extends Check = Check> {
  check: TCheck;
}

export interface CheckHealthProviderProps<TCheck extends Check = Check> {
  check: TCheck;
  metrics: Array<HeaderMetricDefinition<TCheck>>;
}

export interface CheckDashboardHeaderProfile<TCheck extends Check = Check> {
  getDefinition: (check: TCheck) => CheckHeaderDefinitionModel;
  getMetrics: (check: TCheck) => Array<HeaderMetricDefinition<TCheck>>;
  Narrative: ComponentType<HeaderNarrativeProps<TCheck>>;
  HealthProvider?: ComponentType<PropsWithChildren<CheckHealthProviderProps<TCheck>>>;
  Comparison?: CheckDashboardComparisonProfile<TCheck>;
}
