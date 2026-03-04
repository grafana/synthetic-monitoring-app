import type { TestSuggestion } from './useTestSuggestions';

export type StatStatus = 'warning' | 'success' | 'info';
export type Severity = 'critical' | 'warning';
export type TestCategory = 'performance' | 'availability' | 'fallback' | 'latency';
export type TestStatus = 'pass' | 'warn' | 'fail';
export type TestProduct = 'k6' | 'synthetics';

export interface StatCard {
  label: string;
  value: number;
  detail: string;
  status: StatStatus;
}

export type Suggestion = TestSuggestion;

export interface TestEntry {
  status: TestStatus;
  name: string;
  type: TestCategory;
  product: TestProduct;
  linkedIncident: string | null;
  lastRun: string;
  incidentsCovered?: number;
}
