import { z } from 'zod';

const opportunityConfidenceSchema = z.enum(['high', 'medium', 'low']);

const confidenceDimensionSchema = z
  .object({
    level: opportunityConfidenceSchema,
    reason: z.string().optional(),
  })
  .strict();

const reliabilityEvidenceReferenceSchema = z
  .object({
    destination: z.enum(['explore', 'dashboard', 'logs', 'traces']),
    label: z.string().optional(),
    path: z.string(),
  })
  .strict();

const reliabilityEvidencePrototypeSchema = z
  .object({
    kind: z.literal('graft-demo-v1'),
    window: z.object({
      label: z.string(),
      from: z.number().int(),
      to: z.number().int(),
    }),
    exactRequestTotal: z.number().int().nonnegative(),
    timeline: z.array(
      z.object({
        timestamp: z.number().int(),
        requests: z.number().int().nonnegative(),
      })
    ),
    source: z
      .object({
        datasourceUid: z.string(),
        datasourceType: z.string(),
        expression: z.string(),
        from: z.number().int(),
        to: z.number().int(),
      })
      .optional(),
  })
  .strict();

export const reliabilitySuggestionSchema = z
  .object({
    id: z.string(),
    target: z.string(),
    checkType: z.enum(['http', 'dns']),
    evidence: z
      .object({
        reqPerS: z.number().optional(),
        p99Ms: z.number().optional(),
        statusDistribution: z.record(z.string(), z.number()).optional(),
        families: z.array(z.string()).default([]),
        activitySemantics: z.array(z.string()).default([]),
        // The suggestion service must provide the exact Grafana-relative destination.
        // The frontend deliberately does not infer a query from aggregate metric names.
        references: z.array(reliabilityEvidenceReferenceSchema).optional(),
      })
      .loose(),
    // Graft-only contract prototype. The production suggestion API does not return this field yet.
    evidencePrototype: reliabilityEvidencePrototypeSchema.optional(),
    reachability: z.string(),
    reachabilitySource: z.string(),
    confidence: z.string(),
    confidenceBreakdown: z
      .object({
        observation: confidenceDimensionSchema.optional(),
        coverageGap: confidenceDimensionSchema.optional(),
        recommendation: confidenceDimensionSchema.optional(),
      })
      .strict()
      .optional(),
    score: z.number(),
    dedupStatus: z.string(),
    authRequired: z.boolean(),
    needsConfiguration: z.boolean().optional(),
    configurationReason: z.string().optional(),
    algorithms: z.array(z.string()).default([]),
    relevance: z.number().optional(),
    angles: z.array(z.string()).default([]),
    purpose: z.string().optional(),
    rationale: z.string().optional(),
    proposedCheck: z
      .object({
        job: z.string(),
        frequencyMs: z.number(),
        timeoutMs: z.number(),
        validStatusCodes: z.array(z.number()),
        failIfNotSSL: z.boolean(),
        probeIds: z.array(z.number()),
        locationPolicy: z.string().optional(),
      })
      .optional(),
    prompt: z.string(),
  })
  .loose();

export const reliabilitySuggestionsSchema = z.object({
  suggestions: z.array(reliabilitySuggestionSchema),
});

export type ReliabilitySuggestion = z.infer<typeof reliabilitySuggestionSchema>;
export type ReliabilityEvidencePrototype = z.infer<typeof reliabilityEvidencePrototypeSchema>;
export type ReliabilityEvidenceReference = z.infer<typeof reliabilityEvidenceReferenceSchema>;

export type OpportunityValue = 'high' | 'medium' | 'lower';
export type OpportunityConfidence = 'high' | 'medium' | 'low';
export type OpportunityReadiness = 'ready' | 'needs-setup';

export interface ReliabilityEvidenceMetric {
  value: string;
  label: string;
}

export interface ReliabilityEvidenceSnapshot {
  primary?: ReliabilityEvidenceMetric;
  supporting: ReliabilityEvidenceMetric[];
  windowLabel: string;
  availability: 'available' | 'partial' | 'unavailable';
  sourceKind: 'aggregate' | 'prototype';
}

export interface SuggestedCheckConfig {
  job?: string;
  frequencyMs?: number;
  timeoutMs?: number;
  validStatusCodes: number[];
  failIfNotSSL: boolean;
  probeIds: number[];
}

export interface ProposedHttpCheckDraft {
  job: string;
  target: string;
  checkType: 'http';
  method: 'GET';
  frequencyMs: number;
  timeoutMs: number;
  validStatusCodes: number[];
  failIfNotSSL: boolean;
  probeIds: number[];
  locationPolicy: string;
  estimatedExecutionsPerMonth?: number;
}

export interface ReliabilityOpportunity {
  id: string;
  suggestion: ReliabilitySuggestion;
  subject: string;
  observedSummary: string;
  rationale: string;
  gapTitle: string;
  coverageSummary: string;
  importanceSummary: string;
  evidenceSnapshot: ReliabilityEvidenceSnapshot;
  value: OpportunityValue;
  confidence: OpportunityConfidence;
  readiness: OpportunityReadiness;
  actionTitle: string;
  actionSummary: string;
  estimatedUsage?: string;
  sortScore: number;
  requestVolume?: string;
  requestRate?: string;
  errorRate?: string;
  p99?: string;
  evidencePrototype?: ReliabilityEvidencePrototype;
  proposedCheck: ProposedHttpCheckDraft;
}
