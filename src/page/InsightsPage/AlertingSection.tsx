import React from 'react';
import { Badge, Button, Icon, Stack, useStyles2 } from '@grafana/ui';

import type { Check, CheckAlertDraft } from 'types';
import type { InsightsResponse } from 'datasource/responses.types';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS as CHECK_QUERY_KEYS } from 'data/useChecks';
import { INSIGHTS_QUERY_KEYS } from 'data/useInsights';
import { queryClient } from 'data/queryClient';

import { PaginatedList, SectionHeading } from './InsightsPage.components';
import { getStyles } from './InsightsPage.styles';
import { CHECKS_URL, formatAlertName, formatAlertThreshold } from './InsightsPage.utils';

function getRecommendedAlerts(checkType: string): CheckAlertDraft[] {
  const alerts: CheckAlertDraft[] = [
    { name: 'ProbeFailedExecutionsTooHigh' as CheckAlertDraft['name'], threshold: 1, period: '5m' },
  ];

  if (checkType === 'http') {
    alerts.push({ name: 'HTTPRequestDurationTooHighAvg' as CheckAlertDraft['name'], threshold: 300, period: '5m' });
    alerts.push({ name: 'TLSTargetCertificateCloseToExpiring' as CheckAlertDraft['name'], threshold: 30 });
  } else if (checkType === 'ping') {
    alerts.push({ name: 'PingRequestDurationTooHighAvg' as CheckAlertDraft['name'], threshold: 50, period: '5m' });
  } else if (checkType === 'dns') {
    alerts.push({ name: 'DNSRequestDurationTooHighAvg' as CheckAlertDraft['name'], threshold: 100, period: '5m' });
  } else if (checkType === 'tcp') {
    alerts.push({ name: 'TLSTargetCertificateCloseToExpiring' as CheckAlertDraft['name'], threshold: 30 });
  }

  return alerts;
}

function AlertRow({
  check,
  issues,
  onApplied,
}: {
  check: Check;
  issues: string[];
  onApplied: () => void;
}) {
  const styles = useStyles2(getStyles);
  const { mutateAsync: updateAlerts } = useUpdateAlertsForCheck();
  const [expanded, setExpanded] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const checkType = Object.keys(check.settings ?? {})[0] ?? 'unknown';
  const recommended = React.useMemo(() => getRecommendedAlerts(checkType), [checkType]);

  const handleApply = async () => {
    if (!check.id) {
      return;
    }
    setApplying(true);
    try {
      await updateAlerts({ alerts: recommended, checkId: check.id });
      setDone(true);
      setExpanded(false);
      onApplied();
    } catch {
      // handled by mutation meta
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      <div className={styles.perfRowClickable} style={{ cursor: 'default' }}>
        <div className={styles.perfIndicator} style={{ backgroundColor: issues.length > 0 ? styles.colorError : styles.colorWarning }} />
        <div className={styles.perfInfo}>
          <Stack direction="row" gap={0.5} alignItems="center">
            <span className={styles.perfCheckName}>{check.job}</span>
            <a href={`${CHECKS_URL}/${check.id}/edit`} target="_blank" rel="noreferrer" className={styles.dashboardLink} onClick={(e) => e.stopPropagation()}>
              <Icon name="external-link-alt" size="xs" />
            </a>
            <Badge text={checkType} color="blue" />
            {issues.map((issue) => (
              <Badge key={issue} text={issue} color="red" />
            ))}
          </Stack>
        </div>
        {done ? (
          <span className={styles.recoNewValue}>Alerts added</span>
        ) : (
          <Button size="sm" variant={expanded ? 'secondary' : 'primary'} fill="outline" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Close' : 'Set up'}
          </Button>
        )}
      </div>
      {expanded && (
        <div className={styles.inlineInvestigation}>
          <Stack direction="column" gap={0.5}>
            <span className={styles.investigateTitle}>Recommended alerts for "{check.job}"</span>
            {recommended.map((alert) => (
              <div key={alert.name} className={styles.recoItem}>
                <span className={styles.recoItemLabel}>{formatAlertName(alert.name)}</span>
                <span className={styles.recoItemDetail}>
                  {formatAlertThreshold(alert.name, alert.threshold)}
                  {alert.period ? `, every ${alert.period}` : ''}
                </span>
              </div>
            ))}
            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Button size="sm" variant="secondary" fill="text" onClick={() => setExpanded(false)}>
                Cancel
              </Button>
              <a href={`${CHECKS_URL}/${check.id}/edit`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary" fill="outline">
                  Edit check
                </Button>
              </a>
              <Button size="sm" variant="primary" onClick={handleApply} disabled={applying}>
                {applying ? 'Applying...' : `Add ${recommended.length} alerts`}
              </Button>
            </Stack>
          </Stack>
        </div>
      )}
    </div>
  );
}

export function AlertingSection({ data, allChecks }: { data: InsightsResponse; allChecks: Check[] }) {
  const styles = useStyles2(getStyles);
  const { usage } = data;
  const [isOpen, setIsOpen] = React.useState(true);
  const [showApplyAll, setShowApplyAll] = React.useState(false);
  const [applyingAll, setApplyingAll] = React.useState(false);
  const [allDone, setAllDone] = React.useState(false);
  const [appliedCheckIds, setAppliedCheckIds] = React.useState<Set<number>>(new Set());
  const { mutateAsync: updateAlerts } = useUpdateAlertsForCheck();

  const checksWithoutAlerts = React.useMemo(() => {
    const gapIds = new Set(usage.alerting_gaps.check_ids ?? []);
    return allChecks.filter((c) => c.id && gapIds.has(c.id));
  }, [usage.alerting_gaps.check_ids, allChecks]);

  const totalChecks = usage.checks_by_status.enabled + usage.checks_by_status.disabled;

  const checkIssues = React.useMemo(() => {
    const map = new Map<number, string[]>();
    const add = (id: number, label: string) => {
      const arr = map.get(id) ?? [];
      arr.push(label);
      map.set(id, arr);
    };
    data.performance?.uptime_warnings?.forEach((w) => add(w.check_id, 'low uptime'));
    data.performance?.flapping_checks?.forEach((f) => add(f.check_id, 'flapping'));
    data.performance?.latency_degradation?.forEach((l) => add(l.check_id, 'high latency'));
    data.performance?.regional_anomalies?.forEach((r) => add(r.check_id, 'regional issues'));
    return map;
  }, [data.performance]);

  const sortedChecks = React.useMemo(() => {
    return [...checksWithoutAlerts].sort((a, b) => {
      const aIssueCount = (checkIssues.get(a.id!) ?? []).length;
      const bIssueCount = (checkIssues.get(b.id!) ?? []).length;
      if (aIssueCount !== bIssueCount) {
        return bIssueCount - aIssueCount;
      }
      return a.job.localeCompare(b.job);
    });
  }, [checksWithoutAlerts, checkIssues]);

  const allRecommendations = React.useMemo(() => {
    return sortedChecks.map((c) => {
      const checkType = Object.keys(c.settings ?? {})[0] ?? 'unknown';
      return { check: c, alerts: getRecommendedAlerts(checkType), checkType };
    });
  }, [sortedChecks]);

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights }),
      queryClient.invalidateQueries({ queryKey: CHECK_QUERY_KEYS.list }),
    ]);
  };

  const handleRowApplied = (checkId: number) => {
    setAppliedCheckIds((prev) => new Set(prev).add(checkId));
    refreshData();
  };

  const handleApplyAll = async () => {
    setApplyingAll(true);
    try {
      const pending = allRecommendations.filter(
        ({ check }) => check.id && !appliedCheckIds.has(check.id)
      );
      await Promise.all(
        pending.map(({ check, alerts }) => updateAlerts({ alerts, checkId: check.id! }))
      );
      await refreshData();
      setAllDone(true);
      setShowApplyAll(false);
    } catch {
      // handled by mutation meta
    } finally {
      setApplyingAll(false);
    }
  };

  if (sortedChecks.length === 0) {
    return null;
  }

  const remainingRecommendations = allRecommendations.filter(
    ({ check }) => check.id && !appliedCheckIds.has(check.id)
  );
  const totalAlertCount = remainingRecommendations.reduce((sum, r) => sum + r.alerts.length, 0);

  return (
    <div>
      <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        <SectionHeading title="Alerting" tooltip="Checks without any per-check alerts configured" />
      </button>
      {isOpen && (
        <Stack direction="column" gap={1}>
          <span className={styles.perfGroupLabel}>
            {checksWithoutAlerts.length} of {totalChecks} checks have no alerts
          </span>
          <PaginatedList
            items={sortedChecks}
            renderItem={(c) => (
              <AlertRow
                key={c.id}
                check={c}
                issues={checkIssues.get(c.id!) ?? []}
                onApplied={() => handleRowApplied(c.id!)}
              />
            )}
          />
          {!allDone ? (
            !showApplyAll ? (
              <Stack direction="row" gap={1} justifyContent="flex-end">
                <Button variant="primary" onClick={() => setShowApplyAll(true)}>
                  Apply recommended alerts for all
                </Button>
              </Stack>
            ) : (
              <div className={styles.recommendationCard}>
                <h4 className={styles.recommendationTitle}>
                  Add {totalAlertCount} alerts across {remainingRecommendations.length} checks
                </h4>
                <Stack direction="column" gap={0.5}>
                  {remainingRecommendations.map(({ check, alerts }) => (
                    <div key={check.id} className={styles.recoItem}>
                      <span className={styles.recoItemLabel}>{check.job}</span>
                      <span className={styles.recoItemDetail}>
                        {alerts.map((a) => formatAlertName(a.name)).join(', ')}
                      </span>
                    </div>
                  ))}
                </Stack>
                <Stack direction="row" gap={1} justifyContent="flex-end" alignItems="center">
                  <Button variant="secondary" fill="text" onClick={() => setShowApplyAll(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleApplyAll} disabled={applyingAll}>
                    {applyingAll ? 'Applying...' : `Apply ${totalAlertCount} alerts`}
                  </Button>
                </Stack>
              </div>
            )
          ) : (
            <span className={styles.recoNewValue}>All alerts applied successfully</span>
          )}
        </Stack>
      )}
    </div>
  );
}
