import { z } from 'zod';

export const reliabilitySuggestionSchema = z
  .object({
    id: z.string(),
    target: z.string(),
    // Not an enum: the service also emits grpc, tcp and multihttp. An enum makes a
    // single such suggestion throw and discard the WHOLE response, because the
    // array parses as a unit. isInitialReviewCandidate narrows to http anyway.
    checkType: z.string(),
    evidence: z
      .object({
        // Numeric evidence is optional because the service omits zero values.
        // Preserve absence so the UI does not present missing telemetry as zero.
        reqPerS: z.number().optional(),
        errorRatio: z.number().optional(),
        p99Ms: z.number().optional(),
        statusDistribution: z.record(z.string(), z.number()).default({}),
        families: z.array(z.string()).default([]),
        provenance: z
          .object({
            datasource: z.string(),
            queries: z.array(z.object({ expr: z.string(), instant: z.boolean().optional() }).loose()),
            range: z.object({ from: z.string(), to: z.string() }),
          })
          .optional(),
      })
      .loose(),
    reachability: z.string(),
    reachabilitySource: z.string(),
    confidence: z.string(),
    score: z.number(),
    dedupStatus: z.string(),
    authRequired: z.boolean(),
    needsConfiguration: z.boolean().optional(),
    relevance: z.number().optional(),
    rationale: z.string().optional(),
    prompt: z.string(),
  })
  .loose();

export const reliabilitySuggestionsSchema = z.object({
  suggestions: z.array(reliabilitySuggestionSchema),
});

export type ReliabilitySuggestion = z.infer<typeof reliabilitySuggestionSchema>;
export type ReliabilityEvidence = ReliabilitySuggestion['evidence'];

export type OpportunityValue = 'high' | 'medium' | 'lower';
export type OpportunityConfidence = 'high' | 'medium' | 'low';

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
}

export interface ReliabilityOpportunity {
  id: string;
  suggestion: ReliabilitySuggestion;
  subject: string;
  rationale: string;
  value: OpportunityValue;
  confidence: OpportunityConfidence;
  sortScore: number;
  requestVolume?: string;
  requestRate?: string;
  errorRate?: string;
  p99?: string;
  proposedCheck: ProposedHttpCheckDraft;
}
