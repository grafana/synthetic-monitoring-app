export interface ComparisonRange {
  from: number;
  to: number;
}

export type ComparisonReferenceSpec =
  | { kind: 'auto' }
  | { kind: 'previous' }
  | { kind: 'baseline'; presetId: string }
  | { kind: 'shifted'; presetId: string }
  | {
      kind: 'custom';
      from: string;
      to: string;
      matchPrimaryDuration: boolean;
    };

export type ExplicitComparisonReferenceSpec = Exclude<ComparisonReferenceSpec, { kind: 'auto' }>;

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
      spec: ExplicitComparisonReferenceSpec;
      label: string;
      range: ComparisonRange;
      equalDuration: boolean;
    }
  | {
      status: 'invalid';
      spec: ExplicitComparisonReferenceSpec;
      label: string;
      reason: 'invalid-range' | 'overlaps-primary' | 'unknown-preset';
    };

export interface ComparisonPreset {
  id: string;
  label: string;
  order: number;
  resolve: (primary: ComparisonRange, timezone: string) => ComparisonRange;
}
