import { useAppPluginInstalled } from '@grafana/runtime';

import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

import { KG_PLUGIN_ID } from './knowledgeGraph.constants';

/**
 * Single gate for every Knowledge Graph surface in Synthetic Monitoring (insights widget,
 * connected services graph, service-link form section and its label handling).
 *
 * Both conditions must hold:
 * - the Knowledge Graph app is installed on the stack, and
 * - the `synthetic-monitoring-knowledge-graph` feature flag is enabled.
 *
 * The flag exists because the KG app has a large installed base that predates this integration:
 * it lets the SM surfaces roll out per-stack once `SyntheticCheck` entities are actually being
 * discovered, and doubles as a kill switch.
 */
export function useKnowledgeGraphEnabled(): boolean {
  const { isEnabled } = useFeatureFlag(FeatureName.KnowledgeGraph);
  const { value: kgInstalled } = useAppPluginInstalled(KG_PLUGIN_ID);

  return isEnabled && Boolean(kgInstalled);
}
