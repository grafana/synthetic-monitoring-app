import { BadgeColor } from '@grafana/ui';

import { FeatureName } from 'types';

export type OrgFeatureStage = 'experimental' | 'private-preview' | 'public-preview';

export interface OrgFeature {
  name: FeatureName;
  title: string;
  description: string;
  stage: OrgFeatureStage;
}

export const STAGE_LABELS: Record<OrgFeatureStage, string> = {
  experimental: 'Experimental',
  'private-preview': 'Private preview',
  'public-preview': 'Public preview',
};

export const STAGE_BADGE_COLORS: Record<OrgFeatureStage, BadgeColor> = {
  experimental: 'orange',
  'private-preview': 'darkgrey',
  'public-preview': 'blue',
};

// Explicit allowlist: only features listed here can be switched by org admins.
// Internal and migration flags are deliberately excluded.
export const ORG_FEATURES: OrgFeature[] = [
  {
    name: FeatureName.Folders,
    title: 'Folders',
    description: 'Organize checks into Grafana folders and filter the check list by folder.',
    stage: 'public-preview',
  },
  {
    name: FeatureName.CALs,
    title: 'Cost attribution labels',
    description: 'Attach cost attribution labels to checks so usage can be split by team or service.',
    // TODO: confirm stage
    stage: 'public-preview',
  },
  {
    name: FeatureName.SecretsManagement,
    title: 'Secrets management',
    description: 'Store secrets centrally and reference them from scripted and browser checks.',
    // TODO: confirm stage (may be GA now)
    stage: 'public-preview',
  },
  {
    name: FeatureName.TimepointExplorer,
    title: 'Timepoint explorer',
    description: 'Step through individual check executions and their logs on the check dashboard.',
    // TODO: confirm stage
    stage: 'public-preview',
  },
  {
    name: FeatureName.Screenshots,
    title: 'Browser check screenshots',
    description: 'Show screenshots captured by browser checks alongside their logs.',
    stage: 'private-preview',
  },
  {
    name: FeatureName.GRPCChecks,
    title: 'gRPC checks',
    description: 'Create checks that call gRPC health endpoints.',
    stage: 'experimental',
  },
  {
    name: FeatureName.VersionManagement,
    title: 'k6 version management',
    description: 'Choose which k6 release channel scripted and browser checks run on.',
    // TODO: confirm stage
    stage: 'experimental',
  },
  {
    name: FeatureName.CheckSuggestions,
    title: 'Check suggestions',
    description: 'Suggest new checks on the summary dashboard based on your existing services.',
    // TODO: confirm stage
    stage: 'experimental',
  },
  {
    name: FeatureName.KnowledgeGraph,
    title: 'Knowledge graph integration',
    description: 'Link checks to entities in the Grafana knowledge graph.',
    // TODO: confirm stage
    stage: 'experimental',
  },
];
