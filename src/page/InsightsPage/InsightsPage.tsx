import React from 'react';
import { useNavigate } from 'react-router';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Badge, Button, Card, Icon, IconButton, LoadingPlaceholder, Pagination, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { isAssistantAvailable, openAssistant as openAssistantSidebar } from '@grafana/assistant';

import { PLUGIN_URL_PATH } from 'routing/constants';
import type {
  InsightsCheckMeta,
  InsightsResponse,
} from 'datasource/responses.types';
import { useChecks } from 'data/useChecks';
import { useInsights } from 'data/useInsights';
import { useProbes } from 'data/useProbes';

const CHECKS_URL = `${PLUGIN_URL_PATH}checks`;

function SectionHeading({ title, tooltip }: { title: string; tooltip: string }) {
  const styles = useStyles2(getStyles);

  return (
    <h3 className={styles.sectionHeading}>
      {title}
      <Tooltip content={tooltip} placement="top">
        <Icon name="info-circle" size="sm" className={styles.tooltipIcon} />
      </Tooltip>
    </h3>
  );
}

function getCheckLabel(checkId: string | number, checks: Record<string, InsightsCheckMeta>): string {
  const meta = checks[String(checkId)];
  return meta?.job ?? `Check #${checkId}`;
}

function getCheckDashboardUrl(checkId: string | number): string {
  return `${PLUGIN_URL_PATH}checks/${checkId}`;
}

interface UnlabeledCheck {
  id?: number;
  job: string;
}

const PERF_PAGE_SIZE = 7;

function PaginatedList<T>({ items, renderItem, pageSize = PERF_PAGE_SIZE }: { items: T[]; renderItem: (item: T, index: number) => React.ReactNode; pageSize?: number }) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(items.length / pageSize);
  const visible = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      {visible.map((item, i) => renderItem(item, (page - 1) * pageSize + i))}
      {totalPages > 1 && (
        <Stack justifyContent="flex-end">
          <Pagination currentPage={page} numberOfPages={totalPages} onNavigate={setPage} />
        </Stack>
      )}
    </>
  );
}


function useIsAssistantAvailable() {
  const [available, setAvailable] = React.useState(false);

  React.useEffect(() => {
    const sub = isAssistantAvailable().subscribe({
      next: (val) => setAvailable(val),
      error: () => setAvailable(false),
    });
    return () => sub.unsubscribe();
  }, []);

  return available;
}

function AssistantButton({ prompt, origin, title, size = 'md' }: { prompt: string; origin: string; title: string; size?: 'sm' | 'md' }) {
  const available = useIsAssistantAvailable();

  if (!available) {
    return null;
  }

  return (
    <Button
      size={size}
      variant="secondary"
      fill="outline"
      icon="ai-sparkle"
      onClick={() => openAssistantSidebar({ origin, prompt, autoSend: true })}
    >
      {title}
    </Button>
  );
}


function UsageSection({ data, unlabeledChecks, checkProbeNames }: { data: InsightsResponse; unlabeledChecks: UnlabeledCheck[]; checkProbeNames: Map<number, string[]> }) {
  const styles = useStyles2(getStyles);
  const { usage } = data;
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)}>
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
          <h3 className={styles.collapseHeading}>Usage</h3>
        </button>
        <AssistantButton
          size="sm"
          prompt="Analyze my Synthetic Monitoring setup based on the insights data. What are the most critical issues and what should I do about them?"
          origin="grafana/synthetic-monitoring/insights"
          title="Analyze setup"
        />
      </Stack>
      {isOpen && <div className={styles.cardGrid}>
        <Card>
          <Card.Heading>Checks by type</Card.Heading>
          <Card.Description>
            <Stack direction="row" gap={1} wrap="wrap">
              {Object.entries(usage.checks_by_type).map(([type, count]) => (
                <a key={type} href={`${CHECKS_URL}?type=${type}`}>
                  <Badge text={`${type}: ${count}`} color="blue" />
                </a>
              ))}
            </Stack>
          </Card.Description>
        </Card>

        <Card>
          <Card.Heading>Checks by status</Card.Heading>
          <Card.Description>
            <Stack direction="row" gap={1}>
              <a href={`${CHECKS_URL}?status=enabled`}>
                <Badge text={`Enabled: ${usage.checks_by_status.enabled}`} color="green" />
              </a>
              <a href={`${CHECKS_URL}?status=disabled`}>
                <Badge text={`Disabled: ${usage.checks_by_status.disabled}`} color="orange" />
              </a>
            </Stack>
          </Card.Description>
        </Card>

        <Card>
          <Card.Heading>Limit usage</Card.Heading>
          <Card.Description>
            <Stack direction="column" gap={0.5}>
              <LimitBar label="Total checks" current={usage.limit_usage.total_checks.current} max={usage.limit_usage.total_checks.max} href={CHECKS_URL} />
              <LimitBar label="Scripted" current={usage.limit_usage.scripted_checks.current} max={usage.limit_usage.scripted_checks.max} href={`${CHECKS_URL}?type=scripted`} />
              <LimitBar label="Browser" current={usage.limit_usage.browser_checks.current} max={usage.limit_usage.browser_checks.max} href={`${CHECKS_URL}?type=browser`} />
            </Stack>
          </Card.Description>
        </Card>

        <Card>
          <Card.Heading>Alerting</Card.Heading>
          <Card.Description>
            {usage.alerting_gaps.count > 0 ? (
              <Stack direction="column" gap={0.5}>
                <span>{usage.alerting_gaps.count} of {usage.checks_by_status.enabled + usage.checks_by_status.disabled} checks have no alerts</span>
                <a href={`${CHECKS_URL}?alerts=without`} className={styles.redLink}>View affected checks</a>
              </Stack>
            ) : (
              <Badge text="All checks have alerts" color="green" />
            )}
          </Card.Description>
        </Card>

        <Card>
          <Card.Heading>Probe distribution</Card.Heading>
          <Card.Description>
            <Stack direction="column" gap={1}>
              <ProbeHistogram histogram={usage.probe_distribution.histogram} />
              {usage.probe_distribution.checks_with_few_probes.length > 0 && (
                <Tooltip
                  interactive
                  content={
                    <Stack direction="column" gap={0.5}>
                      {usage.probe_distribution.checks_with_few_probes.map((c) => {
                        const name = getCheckLabel(c.check_id, data.checks);
                        const probeNames = checkProbeNames.get(c.check_id) ?? [];
                        return (
                          <div key={c.check_id}>
                            <a href={`${CHECKS_URL}?search=${encodeURIComponent(name)}`}>
                              <strong>{name}</strong>
                            </a>
                            <br />
                            <span>{probeNames.length > 0 ? probeNames.join(', ') : 'No probes'}</span>
                          </div>
                        );
                      })}
                    </Stack>
                  }
                  placement="bottom"
                >
                  <span className={styles.tooltipLink}>
                    {usage.probe_distribution.checks_with_few_probes.length} checks with {'<'} 3 probes
                  </span>
                </Tooltip>
              )}
            </Stack>
          </Card.Description>
        </Card>

        <Card>
          <Card.Heading>Labels</Card.Heading>
          <Card.Description>
            {usage.label_distribution.length > 0 ? (
              <Stack direction="column" gap={0.5}>
                <Stack direction="row" gap={1} wrap="wrap">
                  {usage.label_distribution.map((label) => (
                    <a key={label.name} href={`${CHECKS_URL}?labels=${encodeURIComponent(label.name)}`}>
                      <Badge text={`${label.name} (${label.count})`} color="purple" />
                    </a>
                  ))}
                </Stack>
                {unlabeledChecks.length > 0 && (
                  <Tooltip
                    interactive
                    content={
                      <Stack direction="column" gap={0.25}>
                        {unlabeledChecks.map((c) => (
                          <a key={c.id} href={getCheckDashboardUrl(c.id ?? 0)}>
                            {c.job}
                          </a>
                        ))}
                      </Stack>
                    }
                    placement="bottom"
                  >
                    <span className={styles.tooltipLink}>{unlabeledChecks.length} checks have no labels</span>
                  </Tooltip>
                )}
              </Stack>
            ) : (
              <span className={styles.mutedText}>No checks have labels</span>
            )}
          </Card.Description>
        </Card>
      </div>}
    </div>
  );
}

function ProbeHistogram({ histogram }: { histogram: Record<number, number> }) {
  const styles = useStyles2(getStyles);
  const entries = Object.entries(histogram)
    .map(([probes, count]) => ({ probes: Number(probes), count }))
    .sort((a, b) => a.probes - b.probes);

  const maxCount = Math.max(...entries.map((e) => e.count), 1);

  return (
    <Stack direction="column" gap={0.5}>
      {entries.map(({ probes, count }) => (
        <div key={probes} className={styles.histogramRow}>
          <span className={styles.histogramRowLabel}>{probes} {probes === 1 ? 'probe' : 'probes'}</span>
          <div className={styles.histogramRowTrack}>
            <div className={styles.histogramRowFill} style={{ width: `${(count / maxCount) * 100}%` }} />
          </div>
          <span className={styles.histogramRowCount}>{count}</span>
        </div>
      ))}
    </Stack>
  );
}

function LimitBar({ label, current, max, href }: { label: string; current: number; max: number; href?: string }) {
  const styles = useStyles2(getStyles);
  const pct = max > 0 ? (current / max) * 100 : 0;
  const isHigh = pct > 80;

  return (
    <div>
      <div className={styles.limitLabel}>
        {href ? <a href={href} className={styles.subtleLink}>{label}</a> : <span>{label}</span>}
        <span>{current} / {max}</span>
      </div>
      <div className={styles.limitBarTrack}>
        <div
          className={isHigh ? styles.limitBarFillWarning : styles.limitBarFill}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function PerformanceSection({ data }: { data: InsightsResponse }) {
  const styles = useStyles2(getStyles);
  const { performance, checks } = data;
  const [isOpen, setIsOpen] = React.useState(true);

  if (!performance) {
    return null;
  }

  const hasAnyData =
    (performance.flapping_checks?.length ?? 0) > 0 ||
    (performance.regional_anomalies?.length ?? 0) > 0 ||
    (performance.latency_degradation?.length ?? 0) > 0 ||
    (performance.uptime_warnings?.length ?? 0) > 0;

  if (!hasAnyData) {
    return null;
  }

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)}>
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
          <SectionHeading title="Performance" tooltip="Based on metrics from the last 30 days" />
        </button>
        <AssistantButton
          size="sm"
          prompt="Investigate the performance issues in my Synthetic Monitoring checks. Focus on the checks with uptime warnings, flapping behavior, regional anomalies, and latency degradation. Correlate the data and suggest what to do."
          origin="grafana/synthetic-monitoring/insights/performance"
          title="Investigate with Assistant"
        />
      </Stack>
      {isOpen && <Stack direction="column" gap={1}>
        {(() => {
          const sortedUptime = [...(performance.uptime_warnings ?? [])].sort((a, b) => a.success_rate - b.success_rate);
          const hasCriticalUptime = sortedUptime.some((w) => w.success_rate < 0.9);
          return sortedUptime.length > 0 && (
            <>
              <span className={styles.perfGroupLabel}>
                <Badge text={sortedUptime.length.toString()} color={hasCriticalUptime ? 'red' : 'orange'} />
                {' '}Low uptime: success rate below threshold
              </span>
              <PaginatedList
                items={sortedUptime}
                renderItem={(w) => (
                  <a key={w.check_id} href={getCheckDashboardUrl(w.check_id)} className={styles.perfRow}>
                    <div className={styles.perfIndicator} style={{ backgroundColor: w.success_rate < 0.9 ? styles.colorError : styles.colorWarning }} />
                    <div className={styles.perfInfo}>
                      <span className={styles.perfCheckName}>{getCheckLabel(w.check_id, checks)}</span>
                    </div>
                    <span className={w.success_rate < 0.9 ? styles.perfValueCritical : styles.perfValue}>{(w.success_rate * 100).toFixed(1)}%</span>
                    <div className={styles.perfBar}>
                      <div className={styles.perfBarTrack}>
                        <div
                          className={w.success_rate < 0.9 ? styles.perfBarFillError : styles.perfBarFillWarning}
                          style={{ width: `${w.success_rate * 100}%` }}
                        />
                      </div>
                    </div>
                  </a>
                )}
              />
            </>
          );
        })()}

        {(() => {
          const sortedFlapping = [...(performance.flapping_checks ?? [])].sort((a, b) => b.state_changes - a.state_changes);
          const maxChanges = sortedFlapping.length > 0 ? sortedFlapping[0].state_changes : 1;
          const hasCriticalFlapping = sortedFlapping.some((f) => f.state_changes > 500);
          return sortedFlapping.length > 0 && (
            <>
              <span className={styles.perfGroupLabel}>
                <Badge text={sortedFlapping.length.toString()} color={hasCriticalFlapping ? 'red' : 'orange'} />
                {' '}Flapping: frequently switching between up and down
              </span>
              <PaginatedList
                items={sortedFlapping}
                renderItem={(f) => {
                  const severity = f.state_changes / maxChanges;
                  const isCritical = severity > 0.5;
                  return (
                    <a key={f.check_id} href={getCheckDashboardUrl(f.check_id)} className={styles.perfRow}>
                      <div className={styles.perfIndicator} style={{ backgroundColor: isCritical ? styles.colorError : styles.colorWarning }} />
                      <div className={styles.perfInfo}>
                        <span className={styles.perfCheckName}>{getCheckLabel(f.check_id, checks)}</span>
                      </div>
                      <span className={isCritical ? styles.perfValueCritical : styles.perfValue}>{f.state_changes.toLocaleString()} changes</span>
                      <div className={styles.perfBar}>
                        <div className={styles.perfBarTrack}>
                          <div className={isCritical ? styles.perfBarFillError : styles.perfBarFillWarning} style={{ width: `${severity * 100}%` }} />
                        </div>
                      </div>
                    </a>
                  );
                }}
              />
            </>
          );
        })()}

        {(() => {
          const sortedRegional = [...(performance.regional_anomalies ?? [])].sort((a, b) => a.mean_success_rate - b.mean_success_rate);
          return sortedRegional.length > 0 && (
            <>
              <span className={styles.perfGroupLabel}>
                <Badge text={sortedRegional.length.toString()} color="orange" />
                {' '}Regional anomalies: probes with unusual success rate deviation
              </span>
              <PaginatedList
                items={sortedRegional}
                renderItem={(r) => (
                  <a key={r.check_id} href={getCheckDashboardUrl(r.check_id)} className={styles.perfRow}>
                    <div className={styles.perfIndicator} style={{ backgroundColor: styles.colorWarning }} />
                    <div className={styles.perfInfo}>
                      <span className={styles.perfCheckName}>{getCheckLabel(r.check_id, checks)}</span>
                    </div>
                    <span className={styles.perfValue}>
                      {r.anomalous_probes.join(', ')} ({r.anomalous_probes.length}/{r.total_probes} probes, {(r.mean_success_rate * 100).toFixed(1)}% avg)
                    </span>
                  </a>
                )}
              />
            </>
          );
        })()}

        {(() => {
          const sortedLatency = [...(performance.latency_degradation ?? [])].sort((a, b) => b.degradation_pct - a.degradation_pct);
          const hasCriticalLatency = sortedLatency.some((l) => l.degradation_pct > 100);
          return sortedLatency.length > 0 && (
            <>
              <span className={styles.perfGroupLabel}>
                <Badge text={sortedLatency.length.toString()} color={hasCriticalLatency ? 'red' : 'orange'} />
                {' '}Latency degradation: P95 latency increasing over time
              </span>
              <PaginatedList
                items={sortedLatency}
                renderItem={(l) => {
                  const isCritical = l.degradation_pct > 100;
                  return (
                    <a key={l.check_id} href={getCheckDashboardUrl(l.check_id)} className={styles.perfRow}>
                      <div className={styles.perfIndicator} style={{ backgroundColor: isCritical ? styles.colorError : styles.colorWarning }} />
                      <div className={styles.perfInfo}>
                        <span className={styles.perfCheckName}>{getCheckLabel(l.check_id, checks)}</span>
                      </div>
                      <div className={styles.perfLatencyChange}>
                        <span className={styles.mutedText}>{l.previous_p95_ms.toFixed(0)}ms</span>
                        <span>&rarr;</span>
                        <span className={isCritical ? styles.perfLatencyCritical : styles.perfLatencyBad}>{l.current_p95_ms.toFixed(0)}ms</span>
                        <Badge text={`+${l.degradation_pct.toFixed(0)}%`} color={isCritical ? 'red' : 'orange'} />
                      </div>
                    </a>
                  );
                }}
              />
            </>
          );
        })()}
      </Stack>}
    </div>
  );
}

function RecommendationGroup({
  title,
  icon,
  items,
  renderItem,
  actionLabel,
  onAction,
  onDismiss,
}: {
  title: string;
  icon: string;
  items: Array<{ key: string; label: string; detail: string }>;
  renderItem?: undefined;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.recommendationCard}>
      <div className={styles.recommendationHeader}>
        <h4 className={styles.recommendationTitle}>{title}</h4>
        <IconButton name="times" size="sm" aria-label="Dismiss" onClick={onDismiss} />
      </div>
      <Stack direction="column" gap={0.5}>
        {items.map((item) => (
          <div key={item.key} className={styles.recoItem}>
            <span className={styles.recoItemLabel}>{item.label}</span>
            <span className={styles.recoItemDetail}>{item.detail}</span>
          </div>
        ))}
      </Stack>
      <Stack direction="row" gap={1} justifyContent="flex-end">
        <Button size="sm" variant="primary" fill="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      </Stack>
    </div>
  );
}

function RecommendationsSection({ data }: { data: InsightsResponse }) {
  const styles = useStyles2(getStyles);
  const navigate = useNavigate();
  const { recommendations, checks } = data;
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = React.useState(true);

  const dismiss = (key: string) => {
    setDismissed((prev) => new Set(prev).add(key));
  };

  const groups: Array<{ key: string; element: React.ReactNode }> = [];

  if (recommendations.low_value_checks && recommendations.low_value_checks.length > 0 && !dismissed.has('low-value')) {
    groups.push({
      key: 'low-value',
      element: (
        <RecommendationGroup
          title="Reduce frequency on low-value checks"
          icon="clock"
          items={recommendations.low_value_checks.map((l) => ({
            key: String(l.check_id),
            label: getCheckLabel(l.check_id, checks),
            detail: `${(l.success_rate * 100).toFixed(0)}% success, every ${l.frequency_ms / 1000}s`,
          }))}
          actionLabel="Reduce frequency"
          onAction={() => {
            // Will be hooked to assistant
          }}
          onDismiss={() => dismiss('low-value')}
        />
      ),
    });
  }

  if (recommendations.overlapping_targets && recommendations.overlapping_targets.length > 0 && !dismissed.has('overlapping')) {
    groups.push({
      key: 'overlapping',
      element: (
        <RecommendationGroup
          title="Consolidate overlapping targets"
          icon="exchange-alt"
          items={recommendations.overlapping_targets.map((o) => ({
            key: o.target,
            label: o.target,
            detail: `Monitored by ${o.check_types.join(', ')} (${o.check_ids.length} checks)`,
          }))}
          actionLabel="Review checks"
          onAction={() => {
            const first = recommendations.overlapping_targets![0];
            navigate(`${CHECKS_URL}?search=${encodeURIComponent(first.target)}`);
          }}
          onDismiss={() => dismiss('overlapping')}
        />
      ),
    });
  }

  if (recommendations.duplicate_checks && recommendations.duplicate_checks.length > 0 && !dismissed.has('duplicates')) {
    groups.push({
      key: 'duplicates',
      element: (
        <RecommendationGroup
          title="Checks with the same target and type"
          icon="copy"
          items={recommendations.duplicate_checks.map((d) => ({
            key: `${d.target}-${d.type}`,
            label: `${d.target}`,
            detail: `${d.check_ids.length} ${d.type} checks on same target`,
          }))}
          actionLabel="Review duplicates"
          onAction={() => {
            const first = recommendations.duplicate_checks![0];
            navigate(`${CHECKS_URL}?search=${encodeURIComponent(first.target)}&type=${first.type}`);
          }}
          onDismiss={() => dismiss('duplicates')}
        />
      ),
    });
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)}>
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
          <SectionHeading title="Recommendations" tooltip="Based on check performance over the last 30 days and current configuration" />
        </button>
        <AssistantButton
          size="sm"
          prompt="Based on the recommendations data, help me take action. Which checks should I reduce frequency on, and are the overlapping targets intentional or should I consolidate them?"
          origin="grafana/synthetic-monitoring/insights/recommendations"
          title="Get advice"
        />
      </Stack>
      {isOpen && <Stack direction="column" gap={1}>
        {groups.map(({ key, element }) => (
          <React.Fragment key={key}>{element}</React.Fragment>
        ))}
      </Stack>}
    </div>
  );
}

export function InsightsPage() {
  const { data, isLoading, error, refetch } = useInsights();
  const { data: checks = [] } = useChecks();
  const { data: probes = [] } = useProbes();

  const probeNamesById = React.useMemo(() => {
    const map = new Map<number, string>();
    for (const probe of probes) {
      if (probe.id) {
        map.set(probe.id, probe.name);
      }
    }
    return map;
  }, [probes]);

  const checkProbeNames = React.useMemo(() => {
    const map = new Map<number, string[]>();
    for (const check of checks) {
      if (check.id) {
        map.set(check.id, check.probes.map((pid) => probeNamesById.get(pid) ?? `Probe ${pid}`));
      }
    }
    return map;
  }, [checks, probeNamesById]);

  const unlabeledChecks = React.useMemo(
    () => checks.filter((c) => !c.labels || c.labels.length === 0),
    [checks]
  );

  if (isLoading) {
    return <LoadingPlaceholder text="Loading insights..." />;
  }

  if (error) {
    return (
      <Alert title="Failed to load insights." severity="warning" buttonContent="Retry" onRemove={() => refetch()} />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Stack direction="column" gap={2}>
      <UsageSection data={data} unlabeledChecks={unlabeledChecks} checkProbeNames={checkProbeNames} />
      <PerformanceSection data={data} />
      <RecommendationsSection data={data} />
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  cardGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: theme.spacing(1),
    alignItems: 'stretch',
    '& > div': {
      height: '100%',
    },
  }),
  mutedText: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  limitLabel: css({
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: theme.typography.bodySmall.fontSize,
    marginBottom: theme.spacing(0.25),
  }),
  limitBarTrack: css({
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.background.secondary,
  }),
  limitBarFill: css({
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.primary.main,
    transition: 'width 0.3s ease',
  }),
  limitBarFillWarning: css({
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.warning.main,
    transition: 'width 0.3s ease',
  }),
  histogramRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  histogramRowLabel: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    minWidth: 60,
    textAlign: 'right',
  }),
  histogramRowTrack: css({
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.background.canvas,
  }),
  histogramRowFill: css({
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.primary.main,
    minWidth: 4,
  }),
  histogramRowCount: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    minWidth: 20,
  }),
  redLink: css({
    color: theme.colors.error.text,
    fontSize: theme.typography.bodySmall.fontSize,
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  tooltipLink: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    textDecoration: `underline dotted ${theme.colors.text.disabled}`,
    textUnderlineOffset: 3,
    cursor: 'help',
  }),
  viewLink: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.primary.text,
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  subtleLink: css({
    color: 'inherit',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  colorError: theme.colors.error.main,
  colorWarning: theme.colors.warning.main,
  colorInfo: theme.colors.info.main,
  perfRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    color: 'inherit',
    textDecoration: 'none',
    transition: 'border-color 0.15s ease',
    '&:hover': {
      borderColor: theme.colors.border.medium,
    },
  }),
  perfIndicator: css({
    width: 4,
    height: 32,
    borderRadius: 2,
    flexShrink: 0,
  }),
  perfInfo: css({
    flex: 1,
    minWidth: 0,
  }),
  perfCheckName: css({
    display: 'block',
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
  }),
  perfDetail: css({
    display: 'block',
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  perfGroupLabel: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.primary,
    marginTop: theme.spacing(1),
  }),
  perfValue: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    flexShrink: 0,
    textAlign: 'right',
    minWidth: 80,
  }),
  perfValueCritical: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.error.text,
    fontWeight: theme.typography.fontWeightMedium,
    flexShrink: 0,
    textAlign: 'right',
    minWidth: 80,
  }),
  perfBar: css({
    width: 120,
    flexShrink: 0,
  }),
  perfBarTrack: css({
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.background.canvas,
  }),
  perfBarFillWarning: css({
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.warning.main,
  }),
  perfBarFillError: css({
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.error.main,
  }),
  perfLatencyChange: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    flexShrink: 0,
  }),
  perfLatencyBad: css({
    color: theme.colors.warning.text,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  perfLatencyCritical: css({
    color: theme.colors.error.text,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  investigateResult: css({
    padding: theme.spacing(2),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.medium}`,
    backgroundColor: theme.colors.background.secondary,
  }),
  investigateContent: css({
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    whiteSpace: 'pre-wrap',
  }),
  sectionHeading: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
  }),
  tooltipIcon: css({
    color: theme.colors.text.disabled,
    cursor: 'help',
  }),
  collapseToggle: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'inherit',
    marginBottom: theme.spacing(1),
  }),
  collapseHeading: css({
    margin: 0,
  }),
  recommendationCard: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.medium}`,
    backgroundColor: theme.colors.background.secondary,
  }),
  recommendationHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  recommendationTitle: css({
    margin: 0,
    marginBottom: theme.spacing(0.5),
    fontSize: theme.typography.h5.fontSize,
  }),
  recommendationDescription: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body.fontSize,
  }),
  recoItem: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  recoItemLabel: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  recoItemDetail: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
});
