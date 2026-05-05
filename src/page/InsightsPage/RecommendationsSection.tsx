import React from 'react';
import { Button, Icon, IconButton, Stack, useStyles2 } from '@grafana/ui';

import type { Check } from 'types';
import type { InsightsResponse } from 'datasource/responses.types';

import { useIsAssistantAvailable } from './InsightsPage.hooks';
import { SectionHeading } from './InsightsPage.components';
import { getStyles } from './InsightsPage.styles';
import { DuplicatesCard } from './recommendations/DuplicatesCard';
import { OverlappingCard } from './recommendations/OverlappingCard';
import { ReduceFrequencyCard } from './recommendations/ReduceFrequencyCard';
import { buildRecoSystemPrompt, ORIGINS } from './InsightsPage.prompts';
import { InlineRecommendation } from './recommendations/InlineRecommendation';

export function RecommendationsSection({ data, allChecks }: { data: InsightsResponse; allChecks: Check[] }) {
  const styles = useStyles2(getStyles);
  const { recommendations } = data;
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = React.useState(true);
  const [overlappingInline, setOverlappingInline] = React.useState(false);
  const [duplicatesInline, setDuplicatesInline] = React.useState(false);
  const assistantAvailable = useIsAssistantAvailable();

  const dismiss = (key: string) => {
    setDismissed((prev) => new Set(prev).add(key));
  };

  const hasLowValue = !dismissed.has('low-value');
  const hasOverlapping = recommendations.overlapping_targets && recommendations.overlapping_targets.length > 0 && !dismissed.has('overlapping');
  const hasDuplicates = recommendations.duplicate_checks && recommendations.duplicate_checks.length > 0 && !dismissed.has('duplicates');

  if (!hasLowValue && !hasOverlapping && !hasDuplicates) {
    return null;
  }

  return (
    <div>
      <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        <SectionHeading title="Recommendations" tooltip="Based on check performance over the last 30 days and current configuration" />
      </button>
      {isOpen && (
        <Stack direction="column" gap={1}>
          {hasLowValue && (
            <ReduceFrequencyCard data={data} allChecks={allChecks} onDismiss={() => dismiss('low-value')} />
          )}

          {hasOverlapping && (
            <div className={styles.recommendationCard}>
              <div className={styles.recommendationHeader}>
                <h4 className={styles.recommendationTitle}>Consolidate overlapping targets</h4>
                <IconButton name="times" size="sm" aria-label="Dismiss" onClick={() => dismiss('overlapping')} />
              </div>
              <Stack direction="column" gap={0.5}>
                {recommendations.overlapping_targets!.map((o) => (
                  <OverlappingCard key={o.target} target={o} allChecks={allChecks} data={data} />
                ))}
              </Stack>
              {assistantAvailable && !overlappingInline && (
                <Stack direction="row" gap={1} justifyContent="flex-end">
                  <Button size="sm" variant="primary" fill="outline" icon="ai-sparkle" onClick={() => setOverlappingInline(true)}>
                    Help me consolidate
                  </Button>
                </Stack>
              )}
              {overlappingInline && (
                <InlineRecommendation
                  prompt={`I have ${recommendations.overlapping_targets!.length} targets being monitored by multiple check types: ${recommendations.overlapping_targets!.map((o) => `"${o.target}" (${o.check_types.join(', ')}, ${o.check_ids.length} checks)`).join(', ')}. Which overlaps are redundant and which are intentional? Help me decide which checks to consolidate or remove.`}
                  systemPrompt={buildRecoSystemPrompt(data)}
                  origin={ORIGINS.overlapping}
                  allChecks={allChecks}
                  onClose={() => setOverlappingInline(false)}
                />
              )}
            </div>
          )}

          {hasDuplicates && (
            <div className={styles.recommendationCard}>
              <div className={styles.recommendationHeader}>
                <h4 className={styles.recommendationTitle}>Checks with the same target and type</h4>
                <IconButton name="times" size="sm" aria-label="Dismiss" onClick={() => dismiss('duplicates')} />
              </div>
              <Stack direction="column" gap={0.5}>
                {recommendations.duplicate_checks!.map((d) => (
                  <DuplicatesCard key={`${d.target}-${d.type}`} group={d} allChecks={allChecks} data={data} />
                ))}
              </Stack>
              {assistantAvailable && !duplicatesInline && (
                <Stack direction="row" gap={1} justifyContent="flex-end">
                  <Button size="sm" variant="primary" fill="outline" icon="ai-sparkle" onClick={() => setDuplicatesInline(true)}>
                    Help me clean up
                  </Button>
                </Stack>
              )}
              {duplicatesInline && (
                <InlineRecommendation
                  prompt={`I have ${recommendations.duplicate_checks!.length} groups of duplicate checks (same target and type): ${recommendations.duplicate_checks!.map((d) => `"${d.target}" has ${d.check_ids.length} ${d.type} checks`).join(', ')}. Which duplicates should I remove? Are any of them intentional (e.g. testing from different probe sets)?`}
                  systemPrompt={buildRecoSystemPrompt(data)}
                  origin={ORIGINS.duplicates}
                  allChecks={allChecks}
                  onClose={() => setDuplicatesInline(false)}
                />
              )}
            </div>
          )}
        </Stack>
      )}
    </div>
  );
}
