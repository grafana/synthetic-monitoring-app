import { ComponentProps, FormEvent } from 'react';
import { FieldPath } from 'react-hook-form';
import { IconName } from '@grafana/ui';

import { Check, CheckFormValues, CheckStatus, CheckType, CheckTypeGroup, FeatureName } from 'types';

import { StyledField } from './components/ui/StyledField';

export interface CheckInstrumentation {
  type?: CheckType;
  group?: CheckTypeGroup;
}

export type CheckOrInstrumentation = CheckInstrumentation | Check;

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

export interface FormNavigationState {
  active: FormSectionName;
  activeLabel: string;
  sections: unknown[];
  sectionOrder: FormSectionOrder;
  isSectionActive(sectionName: FormSectionName): boolean;
  setSectionActive(sectionName: FormSectionName): void;
}

// From `CheckEditor.types.ts`
export type FieldProps<T extends CheckFormValues = CheckFormValues> = {
  name: FieldPath<T>;
  onChange?: (e: FormEvent) => void;
  'aria-label'?: string;
  section?: number; // tab index
};

export type TLSConfigFields<T extends CheckFormValues> = {
  tlsServerName?: FieldProps<T>;
  tlsInsecureSkipVerify?: FieldProps<T>;
  tlsCaSCert?: FieldProps<T>;
  tlsClientCert?: FieldProps<T>;
  tlsClientKey?: FieldProps<T>;
};

export enum HTTPAuthType {
  None = 'none',
  BasicAuth = 'basic-auth',
  BearerToken = 'bearer-token',
}

// End of `CheckEditor.types.ts`

export type CheckFormFieldPath = FieldPath<CheckFormValues>;
export type CheckFormSettingsPath = `settings.${CheckType}`;

export type TLSBaseFieldPath = `settings.${CheckType.HTTP | CheckType.TCP | CheckType.GRPC}`;

export interface GenericFieldProps<T extends CheckFormFieldPath = CheckFormFieldPath> {
  label: ComponentProps<typeof StyledField>['label'];
  description?: ComponentProps<typeof StyledField>['description'];
  field: T;
}
