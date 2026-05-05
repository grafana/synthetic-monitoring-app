import React from 'react';
import { Badge, Button, Icon, IconButton, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useInlineAssistant } from '@grafana/assistant';

import type { InsightsCheckMeta, InsightsResponse } from 'datasource/responses.types';
import { PLUGIN_URL_PATH } from 'routing/constants';
import { getExploreUrl } from 'utils';
import { useLogsDS } from 'hooks/useLogsDS';

import { PaginatedList, SectionHeading } from './InsightsPage.components';
import { useCheckInvestigation, useIsAssistantAvailable } from './InsightsPage.hooks';
import { buildInvestigationPrompt, buildInvestigationSystemPrompt, ISSUE_LABELS, ORIGINS } from './InsightsPage.prompts';
import { getStyles } from './InsightsPage.styles';
import { getCheckDashboardUrl, getCheckLabel } from './InsightsPage.utils';

function InvestigationActions({ checkId, data }: { checkId: number; data: InsightsResponse }) {
  const styles = useStyles2(getStyles);
  const logsDS = useLogsDS();
  const checkMeta = data.checks[String(checkId)];

  const hasUptimeIssue = data.performance?.uptime_warnings?.some((w) => w.check_id === checkId);
  const hasFlapping = data.performance?.flapping_checks?.some((f) => f.check_id === checkId);
  const hasLatency = data.performance?.latency_degradation?.some((l) => l.check_id === checkId);
  const hasRegional = data.performance?.regional_anomalies?.some((r) => r.check_id === checkId);

  const now = Date.now();
  const threeHoursAgo = now - 3 * 60 * 60 * 1000;
  const logsExpr = `{job="${checkMeta?.job ?? ''}", instance="${checkMeta?.target ?? ''}", probe_success="0"} | logfmt`;
  const exploreLogsUrl = logsDS?.uid
    ? getExploreUrl(logsDS.uid, [{ expr: logsExpr }], { from: threeHoursAgo, to: now })
    : null;

  return (
    <div className={styles.actionBar}>
      <span className={styles.actionBarLabel}>Quick actions:</span>
      {exploreLogsUrl && (hasUptimeIssue || hasFlapping || hasLatency || hasRegional) && (
        <a href={exploreLogsUrl} target="_blank" rel="noreferrer">
          <Button size="sm" variant="secondary" fill="outline" icon="file-alt">
            {hasUptimeIssue ? 'View failure logs' : 'View logs'}
          </Button>
        </a>
      )}
      <a href={getCheckDashboardUrl(checkId)} target="_blank" rel="noreferrer">
        <Button size="sm" variant="secondary" fill="outline" icon="graph-bar">
          View dashboard
        </Button>
      </a>
      <a href={`${PLUGIN_URL_PATH}checks/${checkId}/edit`} target="_blank" rel="noreferrer">
        <Button size="sm" variant="secondary" fill="outline" icon="pen">
          Edit check
        </Button>
      </a>
    </div>
  );
}

function InlineInvestigation({ checkId, issueType, data, onClose }: { checkId: number; issueType: string; data: InsightsResponse; onClose: () => void }) {
  const { generate, isGenerating, content, error, cancel, reset } = useInlineAssistant();
  const styles = useStyles2(getStyles);
  const checkMeta = data.checks[String(checkId)];
  const checkName = checkMeta?.job ?? `Check #${checkId}`;
  const hasStarted = React.useRef(false);

  React.useEffect(() => {
    if (hasStarted.current) {
      return;
    }
    hasStarted.current = true;

    const allIssues: string[] = [];
    data.performance?.uptime_warnings?.filter((w) => w.check_id === checkId).forEach((w) => {
      allIssues.push(`Uptime: ${(w.success_rate * 100).toFixed(1)}% success rate`);
    });
    data.performance?.flapping_checks?.filter((f) => f.check_id === checkId).forEach((f) => {
      allIssues.push(`Flapping: ${f.state_changes} state changes`);
    });
    data.performance?.regional_anomalies?.filter((r) => r.check_id === checkId).forEach((r) => {
      allIssues.push(`Regional: probes ${r.anomalous_probes.join(', ')} underperforming (mean ${(r.mean_success_rate * 100).toFixed(1)}%)`);
    });
    data.performance?.latency_degradation?.filter((l) => l.check_id === checkId).forEach((l) => {
      allIssues.push(`Latency: P95 ${l.previous_p95_ms.toFixed(0)}ms → ${l.current_p95_ms.toFixed(0)}ms (+${l.degradation_pct.toFixed(0)}%)`);
    });

    generate({
      prompt: buildInvestigationPrompt({ issueType, checkName, checkMeta, allIssues }),
      origin: ORIGINS.investigate,
      systemPrompt: buildInvestigationSystemPrompt(issueType, data),
    });
  }, [checkId, checkMeta, data, generate, issueType]);

  const headerLabel = `Investigating ${ISSUE_LABELS[issueType] ?? issueType} on ${checkName}`;

  return (
    <div className={styles.inlineInvestigation}>
      <div className={styles.investigateHeader}>
        <Stack direction="row" gap={0.5} alignItems="center">
          <Icon name="ai-sparkle" size="sm" />
          <span className={styles.investigateTitle}>{headerLabel}</span>
        </Stack>
        <IconButton name="times" size="sm" aria-label="Close" onClick={() => { cancel(); onClose(); reset(); }} />
      </div>
      {isGenerating && !content && <LoadingPlaceholder text="Analyzing..." />}
      {content && (
        <div
          className={styles.investigateContent}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content) as string) }}
        />
      )}
      {error && <span className={styles.mutedText}>Investigation unavailable</span>}
      {(content || error) && <InvestigationActions checkId={checkId} data={data} />}
    </div>
  );
}

function PerfRow({
  checkId,
  checks,
  indicator,
  value,
  valueClassName,
  rightContent,
  expanded,
  onToggle,
  data,
  issueType,
}: {
  checkId: number;
  checks: Record<string, InsightsCheckMeta>;
  indicator: string;
  value?: string;
  valueClassName?: string;
  rightContent?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  data: InsightsResponse;
  issueType: string;
}) {
  const styles = useStyles2(getStyles);
  const available = useIsAssistantAvailable();

  return (
    <div>
      <div className={styles.perfRowClickable} onClick={available ? onToggle : undefined}>
        <div className={styles.perfIndicator} style={{ backgroundColor: indicator }} />
        <div className={styles.perfInfo}>
          <Stack direction="row" gap={0.5} alignItems="center">
            <span className={styles.perfCheckName}>{getCheckLabel(checkId, checks)}</span>
            <a href={getCheckDashboardUrl(checkId)} className={styles.dashboardLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <Icon name="external-link-alt" size="xs" />
            </a>
          </Stack>
        </div>
        {value && <span className={valueClassName ?? styles.perfValue}>{value}</span>}
        {rightContent}
        {available && <Icon name={expanded ? 'angle-up' : 'ai-sparkle'} size="sm" className={styles.investigateIcon} />}
      </div>
      {expanded && <InlineInvestigation checkId={checkId} issueType={issueType} data={data} onClose={onToggle} />}
    </div>
  );
}

export function PerformanceSection({ data }: { data: InsightsResponse }) {
  const styles = useStyles2(getStyles);
  const { performance, checks } = data;
  const [isOpen, setIsOpen] = React.useState(true);
  const { isExpanded, toggle } = useCheckInvestigation();

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
      <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        <SectionHeading title="Performance" tooltip="Based on metrics from the last 30 days" />
      </button>
      {isOpen && <Stack direction="column" gap={1}>
        {(() => {
          const sorted = [...(performance.uptime_warnings ?? [])].sort((a, b) => a.success_rate - b.success_rate);
          const hasCritical = sorted.some((w) => w.success_rate < 0.9);
          return sorted.length > 0 && (
            <>
              <span className={styles.perfGroupLabel}>
                <Badge text={sorted.length.toString()} color={hasCritical ? 'red' : 'orange'} />
                {' '}Low uptime: success rate below threshold
              </span>
              <PaginatedList
                items={sorted}
                renderItem={(w) => (
                  <PerfRow
                    key={w.check_id} checkId={w.check_id} checks={checks} data={data}
                    indicator={w.success_rate < 0.9 ? styles.colorError : styles.colorWarning}
                    value={`${(w.success_rate * 100).toFixed(1)}%`}
                    valueClassName={w.success_rate < 0.9 ? styles.perfValueCritical : styles.perfValue}
                    rightContent={<div className={styles.perfBar}><div className={styles.perfBarTrack}><div className={w.success_rate < 0.9 ? styles.perfBarFillError : styles.perfBarFillWarning} style={{ width: `${w.success_rate * 100}%` }} /></div></div>}
                    issueType="uptime" expanded={isExpanded(w.check_id, 'uptime')} onToggle={() => toggle(w.check_id, 'uptime')}
                  />
                )}
              />
            </>
          );
        })()}

        {(() => {
          const sorted = [...(performance.flapping_checks ?? [])].sort((a, b) => b.state_changes - a.state_changes);
          const maxChanges = sorted.length > 0 ? sorted[0].state_changes : 1;
          const hasCritical = sorted.some((f) => f.state_changes > 500);
          return sorted.length > 0 && (
            <>
              <span className={styles.perfGroupLabel}>
                <Badge text={sorted.length.toString()} color={hasCritical ? 'red' : 'orange'} />
                {' '}Flapping: frequently switching between up and down
              </span>
              <PaginatedList
                items={sorted}
                renderItem={(f) => {
                  const severity = f.state_changes / maxChanges;
                  const isCritical = severity > 0.5;
                  return (
                    <PerfRow
                      key={f.check_id} checkId={f.check_id} checks={checks} data={data}
                      indicator={isCritical ? styles.colorError : styles.colorWarning}
                      value={`${f.state_changes.toLocaleString()} changes`}
                      valueClassName={isCritical ? styles.perfValueCritical : styles.perfValue}
                      rightContent={<div className={styles.perfBar}><div className={styles.perfBarTrack}><div className={isCritical ? styles.perfBarFillError : styles.perfBarFillWarning} style={{ width: `${severity * 100}%` }} /></div></div>}
                      issueType="flapping" expanded={isExpanded(f.check_id, 'flapping')} onToggle={() => toggle(f.check_id, 'flapping')}
                    />
                  );
                }}
              />
            </>
          );
        })()}

        {(() => {
          const sorted = [...(performance.regional_anomalies ?? [])].sort((a, b) => a.mean_success_rate - b.mean_success_rate);
          return sorted.length > 0 && (
            <>
              <span className={styles.perfGroupLabel}>
                <Badge text={sorted.length.toString()} color="orange" />
                {' '}Regional anomalies: probes with unusual success rate deviation
              </span>
              <PaginatedList
                items={sorted}
                renderItem={(r) => (
                  <PerfRow
                    key={r.check_id} checkId={r.check_id} checks={checks} data={data}
                    indicator={styles.colorWarning}
                    value={`${r.anomalous_probes.join(', ')} (${r.anomalous_probes.length}/${r.total_probes} probes)`}
                    issueType="regional" expanded={isExpanded(r.check_id, 'regional')} onToggle={() => toggle(r.check_id, 'regional')}
                  />
                )}
              />
            </>
          );
        })()}

        {(() => {
          const sorted = [...(performance.latency_degradation ?? [])].sort((a, b) => b.degradation_pct - a.degradation_pct);
          const hasCritical = sorted.some((l) => l.degradation_pct > 100);
          return sorted.length > 0 && (
            <>
              <span className={styles.perfGroupLabel}>
                <Badge text={sorted.length.toString()} color={hasCritical ? 'red' : 'orange'} />
                {' '}Latency degradation: P95 latency increasing over time
              </span>
              <PaginatedList
                items={sorted}
                renderItem={(l) => {
                  const isCritical = l.degradation_pct > 100;
                  return (
                    <PerfRow
                      key={l.check_id} checkId={l.check_id} checks={checks} data={data}
                      indicator={isCritical ? styles.colorError : styles.colorWarning}
                      rightContent={
                        <div className={styles.perfLatencyChange}>
                          <span className={styles.mutedText}>{l.previous_p95_ms.toFixed(0)}ms</span>
                          <span>&rarr;</span>
                          <span className={isCritical ? styles.perfLatencyCritical : styles.perfLatencyBad}>{l.current_p95_ms.toFixed(0)}ms</span>
                          <Badge text={`+${l.degradation_pct.toFixed(0)}%`} color={isCritical ? 'red' : 'orange'} />
                        </div>
                      }
                      issueType="latency" expanded={isExpanded(l.check_id, 'latency')} onToggle={() => toggle(l.check_id, 'latency')}
                    />
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
