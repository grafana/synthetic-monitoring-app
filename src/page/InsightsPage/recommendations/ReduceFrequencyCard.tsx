import React from 'react';
import { Button, Icon, IconButton, Stack, useStyles2 } from '@grafana/ui';

import type { Check } from 'types';
import type { InsightsResponse } from 'datasource/responses.types';
import { useBulkUpdateChecks, useUpdateCheck } from 'data/useChecks';
import { INSIGHTS_QUERY_KEYS } from 'data/useInsights';
import { queryClient } from 'data/queryClient';

import { getStyles } from '../InsightsPage.styles';
import { CHECKS_URL } from '../InsightsPage.utils';

export function ReduceFrequencyCard({
  data,
  allChecks,
  onDismiss,
}: {
  data: InsightsResponse;
  allChecks: Check[];
  onDismiss: () => void;
}) {
  const styles = useStyles2(getStyles);
  const { recommendations } = data;
  const { mutateAsync: bulkUpdate, isPending: isUpdating } = useBulkUpdateChecks();
  const { mutateAsync: updateSingleCheck } = useUpdateCheck();
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [updatingCheckIds, setUpdatingCheckIds] = React.useState<Set<number>>(new Set());

  const checksToReduce = React.useMemo(() => {
    if (!recommendations.low_value_checks) {
      return [];
    }
    const insightsByCheckId = new Map(recommendations.low_value_checks.map((l) => [l.check_id, l]));
    return allChecks
      .filter((c) => {
        if (!c.id) {
          return false;
        }
        const insight = insightsByCheckId.get(c.id);
        if (!insight) {
          return false;
        }
        return c.frequency === insight.frequency_ms;
      })
      .map((c) => ({ ...c, newFrequency: Math.max(c.frequency * 5, 300000) }));
  }, [recommendations.low_value_checks, allChecks]);

  const handleReduceAll = async () => {
    if (checksToReduce.length === 0) {
      return;
    }
    try {
      await bulkUpdate(checksToReduce.map((c) => ({ ...c, frequency: c.newFrequency })));
      await queryClient.invalidateQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights });
      await queryClient.refetchQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights });
      onDismiss();
      setShowConfirm(false);
    } catch {
      // Error handled by mutation meta
    }
  };

  const handleReduceSingle = async (checkToUpdate: typeof checksToReduce[0]) => {
    setUpdatingCheckIds((prev) => new Set(prev).add(checkToUpdate.id!));
    try {
      await updateSingleCheck({ ...checkToUpdate, frequency: checkToUpdate.newFrequency });
      await queryClient.invalidateQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights });
      await queryClient.refetchQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights });
    } catch {
      // Error handled by mutation meta
    } finally {
      setUpdatingCheckIds((prev) => {
        const next = new Set(prev);
        next.delete(checkToUpdate.id!);
        return next;
      });
    }
  };

  if (checksToReduce.length === 0) {
    return null;
  }

  if (showConfirm) {
    return (
      <div className={styles.recommendationCard}>
        <h4 className={styles.recommendationTitle}>Reduce frequency for {checksToReduce.length} checks?</h4>
        <Stack direction="column" gap={0.5}>
          {checksToReduce.map((c) => (
            <div key={c.id} className={styles.recoItem}>
              <span className={styles.recoItemLabel}>
                {c.job}
                <a href={`${CHECKS_URL}/${c.id}/edit`} target="_blank" rel="noreferrer" className={styles.dashboardLink} onClick={(e) => e.stopPropagation()}>
                  <Icon name="external-link-alt" size="xs" />
                </a>
              </span>
              <Stack direction="row" gap={1} alignItems="center">
                <span className={styles.recoItemDetail}>{c.frequency / 1000}s &rarr; <span className={styles.recoNewValue}>{c.newFrequency / 1000}s</span></span>
                <Button
                  size="sm"
                  variant="secondary"
                  fill="outline"
                  onClick={() => handleReduceSingle(c)}
                  disabled={updatingCheckIds.has(c.id!)}
                >
                  {updatingCheckIds.has(c.id!) ? 'Applying...' : 'Apply'}
                </Button>
              </Stack>
            </div>
          ))}
        </Stack>
        <Stack direction="row" gap={1} justifyContent="flex-end">
          <Button size="sm" variant="secondary" fill="text" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={handleReduceAll} disabled={isUpdating}>
            {isUpdating ? 'Applying...' : 'Apply all'}
          </Button>
        </Stack>
      </div>
    );
  }

  return (
    <div className={styles.recommendationCard}>
      <div className={styles.recommendationHeader}>
        <h4 className={styles.recommendationTitle}>Reduce frequency on low-value checks</h4>
        <IconButton name="times" size="sm" aria-label="Dismiss" onClick={onDismiss} />
      </div>
      <Stack direction="column" gap={0.5}>
        {checksToReduce.map((c) => (
          <div key={c.id} className={styles.recoItem}>
            <span className={styles.recoItemLabel}>
              {c.job}
              <a href={`${CHECKS_URL}/${c.id}/edit`} target="_blank" rel="noreferrer" className={styles.dashboardLink} onClick={(e) => e.stopPropagation()}>
                <Icon name="external-link-alt" size="xs" />
              </a>
            </span>
            <span className={styles.recoItemDetail}>every {c.frequency / 1000}s</span>
          </div>
        ))}
      </Stack>
      <Stack direction="row" gap={1} justifyContent="flex-end">
        <Button size="sm" variant="primary" fill="outline" onClick={() => setShowConfirm(true)}>
          Reduce frequency
        </Button>
      </Stack>
    </div>
  );
}
