import { ComponentProps, ComponentType } from 'react';
import { FieldErrors, FieldPath } from 'react-hook-form';
import { IconName, Tab } from '@grafana/ui';

import { CheckFormValues, CheckStatus, CheckType, CheckTypeGroup, FeatureName } from 'types';

import { StyledField } from './components/ui/StyledField';

export interface CheckTypeOption {
  label: string;
  value: CheckType;
  group: CheckTypeGroup;
  description: string;
  status?: {
    value: CheckStatus;
    description: string;
  };
  featureToggle?: FeatureName; // require a feature flag to be TRUE to use this check type
}

// TODO: implement onClick from `useCheckTypeGroupOptions()`
export interface CheckTypeGroupOption {
  label: string;
  description: string;
  value: CheckTypeGroup;
  icon: IconName;
  protocols: CheckType[];
  featureToggle?: FeatureName; // require a feature flag to be TRUE to use this check group
}

export enum FormSectionName {
  Check = 'check',
  Uptime = 'uptime',
  Labels = 'labels',
  Execution = 'execution',
  Alerting = 'alerting',
}

export type FormSectionOrder = FormSectionName[];

export type FormFieldMatch = CheckFormFieldPath | RegExp | string;

export interface FormNavigationState {
  active: FormSectionName;
  activeLabel: string;
  sections: unknown[];
  sectionOrder: FormSectionOrder;
  isSectionActive(sectionName: FormSectionName): boolean;
  setSectionActive(sectionName: FormSectionName): void;
  registerSection(sectionName: FormSectionName, fields: FormFieldMatch[] | undefined, navLabel?: string): void;
  sectionByErrors(errors?: FieldErrors | string[]): void;
  getSectionFields(sectionName: FormSectionName): Array<CheckFormFieldPath | FormFieldMatch>;
  isSeenStep(sectionName: FormSectionName): boolean;
  getSectionLabel(sectionName: FormSectionName): string;
  completeAllSteps(): void;
  stepActions: {
    next: { name: FormSectionName; label: string } | null;
    previous: { name: FormSectionName; label: string } | null;
  };
  isStepsComplete: boolean;
  errors: string[] | undefined;
}

export enum HTTPAuthType {
  None = 'none',
  BasicAuth = 'basic-auth',
  BearerToken = 'bearer-token',
}

export type FeatureTabLabel = ComponentProps<typeof Tab>['label'];
export type FeatureTabConfigAll = [FeatureTabLabel, ComponentType, CheckType[]];
export type FeatureTabConfigFeatureToggle = [FeatureTabLabel, ComponentType, CheckType[], FeatureName];
export type FeatureTabConfig = FeatureTabConfigAll | FeatureTabConfigFeatureToggle;

export type CheckFormFieldPath = FieldPath<CheckFormValues>;

export type TLSBaseFieldPath = `settings.${CheckType.HTTP | CheckType.TCP | CheckType.GRPC}`;

export interface GenericFieldProps<T extends CheckFormFieldPath = CheckFormFieldPath> {
  label: ComponentProps<typeof StyledField>['label'];
  description?: ComponentProps<typeof StyledField>['description'];
  field: T;
}
