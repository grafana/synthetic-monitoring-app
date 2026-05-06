import React from 'react';
import { Badge, Button, Icon, Stack, useStyles2 } from '@grafana/ui';

import type { Check } from 'types';
import type { InsightsResponse, OverlappingTarget } from 'datasource/responses.types';
import { queryClient } from 'data/queryClient';
import { useUpdateCheck } from 'data/useChecks';
import { INSIGHTS_QUERY_KEYS } from 'data/useInsights';
import { getCheckType } from 'components/Checkster/utils/check/getCheckType';

import { getStyles } from '../InsightsPage.styles';
import { CHECKS_URL } from '../InsightsPage.utils';

export function OverlappingCard({
  target,
  allChecks,
  data,
}: {
  target: OverlappingTarget;
  allChecks: Check[];
  data: InsightsResponse;
}) {
  const styles = useStyles2(getStyles);
  const [expanded, setExpanded] = React.useState(false);
  const [disablingIds, setDisablingIds] = React.useState<Set<number>>(new Set());
  const { mutateAsync: updateCheck } = useUpdateCheck();
  const checksInGroup = React.useMemo(
    () => allChecks.filter((c) => c.id && target.check_ids.includes(c.id)),
    [allChecks, target.check_ids]
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
          {target.target}
          <a href={`${CHECKS_URL}?search=${encodeURIComponent(target.target)}`} target="_blank" rel="noreferrer" className={styles.dashboardLink} onClick={(e) => e.stopPropagation()}>
            <Icon name="external-link-alt" size="xs" />
          </a>
        </span>
        <span className={styles.recoItemDetail}>{target.check_types.join(', ')} ({target.check_ids.length} checks)</span>
      </div>
      {expanded && (
        <div style={{ paddingLeft: 16, marginTop: 4 }}>
        <Stack direction="column" gap={0.5}>
          {checksInGroup.map((c) => (
            <div key={c.id} className={styles.recoItem}>
              <span className={styles.recoItemLabel}>
                {c.job}
                <Badge text={getCheckType(c)} color="blue" />
                <a href={`${CHECKS_URL}/${c.id}/edit`} target="_blank" rel="noreferrer" className={styles.dashboardLink} onClick={(e) => e.stopPropagation()}>
                  <Icon name="external-link-alt" size="xs" />
                </a>
                {!c.enabled && <Badge text="disabled" color="orange" />}
              </span>
              {c.enabled && (
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
        </Stack>
        </div>
      )}
    </div>
  );
}
