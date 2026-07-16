import { Check, Label } from 'types';

export {
  KG_ENTITY_ASSERTIONS_WIDGET_ID,
  KG_NAMESPACE_LABEL,
  KG_PLUGIN_ID,
  KG_SERVICE_ENTITY_TYPE,
  KG_SERVICE_NAME_LABEL,
  KG_SYNTHETIC_CHECK_ENTITY_TYPE,
} from './knowledgeGraph.constants';

export function findLabelValue(labels: Label[], name: string): string | undefined {
  return labels.find((l) => l.name === name)?.value || undefined;
}

/**
 * The KG identifies a SyntheticCheck entity by a composite of the check's `job` and
 * `target` labels (joined with `__`), matching the `sm_check_id` entity name produced
 * by the entity discovery rule.
 */
export function getSyntheticCheckEntityName(check: Pick<Check, 'job' | 'target'>): string {
  return `${check.job}__${check.target}`;
}
