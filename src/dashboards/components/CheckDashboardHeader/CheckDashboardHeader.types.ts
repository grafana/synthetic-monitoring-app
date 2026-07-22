import { ComponentType } from 'react';
import { GrafanaTheme2, PanelData } from '@grafana/data';
import { DashboardPanelDefinition } from 'dashboards/hooks/useDashboardPanelQuery';

import { Check, Label } from 'types';

export interface HeaderDefinitionFact {
  id: string;
  label: string;
  value: string;
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
  Details?: ComponentType<HeaderMetricDetailProps<TCheck>>;
}

export interface HeaderNarrativeProps<TCheck extends Check = Check> {
  check: TCheck;
}

export interface CheckDashboardHeaderProfile<TCheck extends Check = Check> {
  getDefinition: (check: TCheck) => CheckHeaderDefinitionModel;
  getMetrics: (check: TCheck) => Array<HeaderMetricDefinition<TCheck>>;
  Narrative: ComponentType<HeaderNarrativeProps<TCheck>>;
}
