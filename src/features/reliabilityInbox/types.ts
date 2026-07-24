import { z } from 'zod';

export const reliabilitySuggestionSchema = z
  .object({
    id: z.string(),
    target: z.string(),
    checkType: z.enum(['http', 'dns']),
    evidence: z
      .object({
        reqPerS: z.number(),
        p99Ms: z.number(),
        statusDistribution: z.record(z.string(), z.number()),
        families: z.array(z.string()).default([]),
        activitySemantics: z.array(z.string()).default([]),
      })
      .loose(),
    reachability: z.string(),
    reachabilitySource: z.string(),
    confidence: z.string(),
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

export type OpportunityValue = 'high' | 'medium' | 'lower';
export type OpportunityConfidence = 'high' | 'medium' | 'low';
export type OpportunityReadiness = 'ready' | 'needs-setup';

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
  value: OpportunityValue;
  confidence: OpportunityConfidence;
  readiness: OpportunityReadiness;
  actionTitle: string;
  actionSummary: string;
  estimatedUsage?: string;
  sortScore: number;
  requestVolume: string;
  requestRate: string;
  errorRate: string;
  p99: string;
  proposedCheck: ProposedHttpCheckDraft;
}
