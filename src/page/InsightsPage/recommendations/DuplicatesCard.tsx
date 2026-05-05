import React from 'react';
import { Badge, Button, Icon, Stack, useStyles2 } from '@grafana/ui';

import type { Check } from 'types';
import type { DuplicateGroup, InsightsResponse } from 'datasource/responses.types';
import { useUpdateCheck } from 'data/useChecks';
import { INSIGHTS_QUERY_KEYS } from 'data/useInsights';
import { queryClient } from 'data/queryClient';

import { useIsAssistantAvailable } from '../InsightsPage.hooks';
import { getStyles } from '../InsightsPage.styles';
import { CHECKS_URL } from '../InsightsPage.utils';
import { buildRecoSystemPrompt, ORIGINS } from '../InsightsPage.prompts';
import { InlineRecommendation } from './InlineRecommendation';

export function DuplicatesCard({
  group,
  allChecks,
  data,
}: {
  group: DuplicateGroup;
  allChecks: Check[];
  data: InsightsResponse;
}) {
  const styles = useStyles2(getStyles);
  const [expanded, setExpanded] = React.useState(false);
  const [disablingIds, setDisablingIds] = React.useState<Set<number>>(new Set());
  const { mutateAsync: updateCheck } = useUpdateCheck();
  const assistantAvailable = useIsAssistantAvailable();
  const [showInline, setShowInline] = React.useState(false);

  const checksInGroup = React.useMemo(
    () => allChecks.filter((c) => c.id && group.check_ids.includes(c.id)),
    [allChecks, group.check_ids]
  );

  const handleDisable = async (check: Check) => {
    setDisablingIds((prev) => new Set(prev).add(check.id!));
    try {
      await updateCheck({ ...check, enabled: false });
      await queryClient.invalidateQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights });
      await queryClient.refetchQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights });
    } catch {
      // handled by mutation meta
    } finally {
      setDisablingIds((prev) => { const next = new Set(prev); next.delete(check.id!); return next; });
    }
  };

  return (
    <div>
      <div className={styles.recoItem} style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <span className={styles.recoItemLabel}>
          <Icon name={expanded ? 'angle-down' : 'angle-right'} size="sm" />
          {group.target}
          <a href={`${CHECKS_URL}?search=${encodeURIComponent(group.target)}&type=${group.type}`} target="_blank" rel="noreferrer" className={styles.dashboardLink} onClick={(e) => e.stopPropagation()}>
            <Icon name="external-link-alt" size="xs" />
          </a>
        </span>
        <span className={styles.recoItemDetail}>{group.check_ids.length} {group.type} checks</span>
      </div>
      {expanded && (
        <div style={{ paddingLeft: 16, marginTop: 4 }}>
        <Stack direction="column" gap={0.5}>
          {checksInGroup.map((c, idx) => (
            <div key={c.id} className={styles.recoItem}>
              <span className={styles.recoItemLabel}>
                {c.job}
                <a href={`${CHECKS_URL}/${c.id}/edit`} target="_blank" rel="noreferrer" className={styles.dashboardLink} onClick={(e) => e.stopPropagation()}>
                  <Icon name="external-link-alt" size="xs" />
                </a>
                {idx === 0 && <Badge text="keep" color="green" />}
                {!c.enabled && <Badge text="disabled" color="orange" />}
              </span>
              {idx > 0 && c.enabled && (
                <Button
                  size="sm"
                  variant="destructive"
                  fill="outline"
                  onClick={() => handleDisable(c)}
                  disabled={disablingIds.has(c.id!)}
                >
                  {disablingIds.has(c.id!) ? 'Disabling...' : 'Disable'}
                </Button>
              )}
            </div>
          ))}
          {assistantAvailable && !showInline && (
            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Button size="sm" variant="primary" fill="outline" icon="ai-sparkle" onClick={() => setShowInline(true)}>
                Help me decide
              </Button>
            </Stack>
          )}
          {showInline && (
            <InlineRecommendation
              prompt={`I have ${group.check_ids.length} duplicate ${group.type} checks on "${group.target}": ${checksInGroup.map((c) => `"${c.job}" (id: ${c.id}, frequency: ${c.frequency / 1000}s, probes: ${c.probes.length})`).join(', ')}. Which should I keep and which should I disable? Consider their probe coverage, frequency, and configuration.`}
              systemPrompt={buildRecoSystemPrompt(data)}
              origin={ORIGINS.duplicates}
              allChecks={allChecks}
              onClose={() => setShowInline(false)}
            />
          )}
        </Stack>
        </div>
      )}
    </div>
  );
}
