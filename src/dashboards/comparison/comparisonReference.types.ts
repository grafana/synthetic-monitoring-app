export interface ComparisonRange {
  from: number;
  to: number;
}

export type ComparisonReferenceSpec =
  | { kind: 'normal' }
  | { kind: 'previous' }
  | { kind: 'shifted'; presetId: string }
  | {
      kind: 'custom';
      from: string;
      to: string;
      matchPrimaryDuration: boolean;
    };

export type ManualComparisonReferenceSpec = Exclude<ComparisonReferenceSpec, { kind: 'normal' }>;

export type ComparisonReferenceValidation =
  | {
      status: 'valid';
      range: ComparisonRange;
      equalDuration: boolean;
    }
  | {
      status: 'invalid';
      reason: 'invalid-range' | 'overlaps-primary' | 'unknown-preset';
    };

export type ResolvedDisplayReference =
  | {
      status: 'valid';
      spec: ComparisonReferenceSpec;
      label: string;
      range: ComparisonRange;
      equalDuration: boolean;
    }
  | {
      status: 'invalid';
      spec: ComparisonReferenceSpec;
      label: string;
      reason: 'invalid-range' | 'overlaps-primary' | 'unknown-preset' | 'normal-not-established';
    };

export interface ComparisonPreset {
  id: string;
  label: string;
  order: number;
  resolve: (primary: ComparisonRange, timezone: string) => ComparisonRange;
}
