import React from 'react';
import { useAppPluginInstalled, usePluginComponent } from '@grafana/runtime';
import { useTimeRange } from '@grafana/scenes-react';

import { Check } from 'types';

import {
  getSyntheticCheckEntityName,
  KG_ENTITY_ASSERTIONS_WIDGET_ID,
  KG_PLUGIN_ID,
  KG_SYNTHETIC_CHECK_ENTITY_TYPE,
} from './knowledgeGraph';

interface EntityAssertionsWidgetQuery {
  entityName?: string;
  entityType?: string | string[];
  start: number;
  end: number;
  enabled: boolean;
  scope?: unknown;
}

interface EntityAssertionsWidgetProps {
  query: EntityAssertionsWidgetQuery;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  source?: string;
}

interface CheckKnowledgeGraphInsightsProps {
  check: Check;
}

export function CheckKnowledgeGraphInsights({ check }: CheckKnowledgeGraphInsightsProps) {
  const { value: kgInstalled } = useAppPluginInstalled(KG_PLUGIN_ID);
  const { component: AssertionsWidget } = usePluginComponent<EntityAssertionsWidgetProps>(
    KG_ENTITY_ASSERTIONS_WIDGET_ID
  );
  const [timeRange] = useTimeRange();

  if (!kgInstalled || !AssertionsWidget) {
    return null;
  }

  return (
    <AssertionsWidget
      size="md"
      source="synthetic-monitoring"
      query={{
        entityName: getSyntheticCheckEntityName(check),
        entityType: KG_SYNTHETIC_CHECK_ENTITY_TYPE,
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
        enabled: true,
      }}
    />
  );
}
