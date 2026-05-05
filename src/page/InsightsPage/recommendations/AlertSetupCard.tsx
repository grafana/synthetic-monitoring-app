import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useInlineAssistant } from '@grafana/assistant';
import { Badge, Button, Icon, IconButton, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';

import type { Check, CheckAlertDraft } from 'types';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS as CHECK_QUERY_KEYS } from 'data/useChecks';
import { INSIGHTS_QUERY_KEYS } from 'data/useInsights';
import { queryClient } from 'data/queryClient';

import { getStyles } from '../InsightsPage.styles';
import { CHECKS_URL, formatAlertName, formatAlertThreshold } from '../InsightsPage.utils';
import { buildAlertSetupPrompt, buildAlertSetupSystemPrompt, ORIGINS } from '../InsightsPage.prompts';
import type { InsightsResponse } from 'datasource/responses.types';

interface ProposedCheckAlerts {
  check_id: number;
  check_name: string;
  alerts: CheckAlertDraft[];
}

const ALERTS_MARKER = '```json:alerts';

function parseContent(content: string): { markdown: string; proposals: ProposedCheckAlerts[] } {
  const markerIdx = content.indexOf(ALERTS_MARKER);
  if (markerIdx === -1) {
    return { markdown: content, proposals: [] };
  }

  const markdown = content.slice(0, markerIdx).trim();
  const jsonStart = markerIdx + ALERTS_MARKER.length;
  const jsonEnd = content.indexOf('```', jsonStart);
  const jsonStr = content.slice(jsonStart, jsonEnd === -1 ? undefined : jsonEnd).trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return { markdown, proposals: parsed as ProposedCheckAlerts[] };
    }
  } catch {
    // JSON not fully streamed yet
  }

  return { markdown, proposals: [] };
}

function AlertProposalRow({ proposal, allChecks }: { proposal: ProposedCheckAlerts; allChecks: Check[] }) {
  const styles = useStyles2(getStyles);
  const { mutateAsync: updateAlerts } = useUpdateAlertsForCheck();
  const [expanded, setExpanded] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const check = allChecks.find((c) => c.id === proposal.check_id);

  const handleConfirm = async () => {
    if (!check?.id) {
      return;
    }
    setExecuting(true);
    try {
      const existingAlerts = check.alerts ?? [];
      const existingNames = new Set(existingAlerts.map((a) => a.name));
      const newAlerts = proposal.alerts.filter((a) => !existingNames.has(a.name));
      const merged = [...existingAlerts, ...newAlerts];
      await updateAlerts({ alerts: merged, checkId: check.id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights }),
        queryClient.invalidateQueries({ queryKey: CHECK_QUERY_KEYS.list }),
      ]);
      setDone(true);
      setExpanded(false);
    } catch {
      // handled by mutation meta
    } finally {
      setExecuting(false);
    }
  };

  if (!check) {
    return null;
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div className={styles.recoItem}>
        <span className={styles.recoItemLabel}>
          {proposal.check_name}
          <a href={`${CHECKS_URL}/${check.id}/edit`} target="_blank" rel="noreferrer" className={styles.dashboardLink} onClick={(e) => e.stopPropagation()}>
            <Icon name="external-link-alt" size="xs" />
          </a>
          {proposal.alerts.map((a) => (
            <Badge key={a.name} text={formatAlertName(a.name)} color="blue" />
          ))}
        </span>
        {done ? (
          <span className={styles.recoNewValue}>Applied</span>
        ) : (
          <Button size="sm" variant="primary" fill="outline" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Close' : 'Review'}
          </Button>
        )}
      </div>
      {expanded && (
        <div style={{ marginTop: 4, marginLeft: 12 }}>
          <Stack direction="column" gap={0.5}>
            <span className={styles.recoItemDetail}>
              Will add {proposal.alerts.length} alert{proposal.alerts.length !== 1 ? 's' : ''} to "{proposal.check_name}":
            </span>
            {proposal.alerts.map((alert) => (
              <Stack key={alert.name} direction="row" gap={0.5} alignItems="center">
                <span className={styles.recoItemLabel}>{formatAlertName(alert.name)}</span>
                <span className={styles.recoItemDetail}>
                  threshold: {formatAlertThreshold(alert.name, alert.threshold)}
                  {alert.period ? `, period: ${alert.period}` : ''}
                </span>
              </Stack>
            ))}
            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Button size="sm" variant="secondary" fill="text" onClick={() => setExpanded(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleConfirm} disabled={executing}>
                {executing ? 'Applying...' : `Add ${proposal.alerts.length} alerts`}
              </Button>
            </Stack>
          </Stack>
        </div>
      )}
    </div>
  );
}


export function AlertSetupCard({
  data,
  allChecks,
  onClose,
}: {
  data: InsightsResponse;
  allChecks: Check[];
  onClose: () => void;
}) {
  const { generate, isGenerating, content, error, cancel, reset } = useInlineAssistant();
  const styles = useStyles2(getStyles);
  const hasStarted = React.useRef(false);
  const { mutateAsync: updateAlerts } = useUpdateAlertsForCheck();
  const [applyingAll, setApplyingAll] = React.useState(false);
  const [allDone, setAllDone] = React.useState(false);

  const checksWithoutAlerts = React.useMemo(() => {
    const gapIds = new Set(data.usage?.alerting_gaps?.check_ids ?? []);
    return allChecks
      .filter((c) => c.id && gapIds.has(c.id) && c.enabled)
      .map((c) => ({
        id: c.id!,
        job: c.job,
        type: Object.keys(c.settings ?? {})[0] ?? 'unknown',
      }));
  }, [data, allChecks]);

  React.useEffect(() => {
    if (hasStarted.current || checksWithoutAlerts.length === 0) {
      return;
    }
    hasStarted.current = true;
    generate({
      prompt: buildAlertSetupPrompt(checksWithoutAlerts),
      origin: ORIGINS.alertSetup,
      systemPrompt: buildAlertSetupSystemPrompt(data),
    });
  }, [checksWithoutAlerts, data, generate]);

  const { markdown, proposals } = content ? parseContent(content) : { markdown: '', proposals: [] };
  const validProposals = proposals.filter((p) => allChecks.some((c) => c.id === p.check_id));
  const showProposals = !isGenerating && validProposals.length > 0;

  const handleApplyAll = async () => {
    setApplyingAll(true);
    try {
      for (const proposal of validProposals) {
        const check = allChecks.find((c) => c.id === proposal.check_id);
        if (!check?.id) {
          continue;
        }
        const existingAlerts = check.alerts ?? [];
        const existingNames = new Set(existingAlerts.map((a) => a.name));
        const newAlerts = proposal.alerts.filter((a) => !existingNames.has(a.name));
        if (newAlerts.length === 0) {
          continue;
        }
        const merged = [...existingAlerts, ...newAlerts];
        await updateAlerts({ alerts: merged, checkId: check.id });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights }),
        queryClient.invalidateQueries({ queryKey: CHECK_QUERY_KEYS.list }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights }),
        queryClient.refetchQueries({ queryKey: CHECK_QUERY_KEYS.list }),
      ]);
      setAllDone(true);
    } catch {
      // handled by mutation meta
    } finally {
      setApplyingAll(false);
    }
  };

  return (
    <div className={styles.inlineInvestigation}>
      <div className={styles.investigateHeader}>
        <Stack direction="row" gap={0.5} alignItems="center">
          <Icon name="ai-sparkle" size="sm" />
          <span className={styles.investigateTitle}>Alert recommendations</span>
        </Stack>
        <IconButton name="times" size="sm" aria-label="Close" onClick={() => { cancel(); onClose(); reset(); }} />
      </div>
      {isGenerating && !content && <LoadingPlaceholder text="Analyzing checks..." />}
      {markdown && (
        <div
          className={styles.investigateContent}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(markdown) as string) }}
        />
      )}
      {showProposals && !allDone && (
        <>
          <Stack direction="column" gap={0}>
            {validProposals.map((proposal) => (
              <AlertProposalRow key={proposal.check_id} proposal={proposal} allChecks={allChecks} />
            ))}
          </Stack>
          <Stack direction="row" gap={1} justifyContent="flex-end">
            <Button variant="primary" onClick={handleApplyAll} disabled={applyingAll}>
              {applyingAll ? 'Applying...' : `Apply all (${validProposals.length} checks)`}
            </Button>
          </Stack>
        </>
      )}
      {allDone && <span className={styles.recoNewValue}>All alerts applied successfully</span>}
      {error && <span className={styles.mutedText}>Alert recommendations unavailable</span>}
    </div>
  );
}
