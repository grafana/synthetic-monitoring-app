import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useInlineAssistant } from '@grafana/assistant';
import { Badge, Button, Icon, IconButton, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';

import type { Check } from 'types';
import { QUERY_KEYS as CHECK_QUERY_KEYS, useDeleteCheck, useUpdateCheck } from 'data/useChecks';
import { INSIGHTS_QUERY_KEYS } from 'data/useInsights';
import { queryClient } from 'data/queryClient';

import { getStyles } from '../InsightsPage.styles';
import { CHECKS_URL } from '../InsightsPage.utils';

interface RecoAction {
  action: 'disable' | 'delete';
  check_ids: number[];
  label: string;
}

const ACTIONS_MARKER = '```json:actions';

function parseContent(content: string): { markdown: string; actions: RecoAction[] } {
  const markerIdx = content.indexOf(ACTIONS_MARKER);
  if (markerIdx === -1) {
    return { markdown: content, actions: [] };
  }

  const markdown = content.slice(0, markerIdx).trim();
  const jsonStart = markerIdx + ACTIONS_MARKER.length;
  const jsonEnd = content.indexOf('```', jsonStart);
  const jsonStr = content.slice(jsonStart, jsonEnd === -1 ? undefined : jsonEnd).trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return { markdown, actions: parsed as RecoAction[] };
    }
  } catch {
    // JSON not fully streamed yet
  }

  return { markdown, actions: [] };
}

function ActionRow({ action, allChecks }: { action: RecoAction; allChecks: Check[] }) {
  const styles = useStyles2(getStyles);
  const { mutateAsync: updateCheck } = useUpdateCheck();
  const { mutateAsync: deleteCheck } = useDeleteCheck();
  const [expanded, setExpanded] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [reverting, setReverting] = React.useState(false);

  const affectedChecks = React.useMemo(
    () => allChecks.filter((c) => c.id && action.check_ids.includes(c.id)),
    [allChecks, action.check_ids]
  );

  const isDelete = action.action === 'delete';
  const verb = isDelete ? 'Delete' : 'Disable';

  const handleConfirm = async () => {
    setExecuting(true);
    try {
      for (const check of affectedChecks) {
        if (isDelete) {
          await deleteCheck(check);
        } else if (check.enabled) {
          await updateCheck({ ...check, enabled: false });
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights }),
        queryClient.invalidateQueries({ queryKey: CHECK_QUERY_KEYS.list }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights }),
        queryClient.refetchQueries({ queryKey: CHECK_QUERY_KEYS.list }),
      ]);
      setDone(true);
      setExpanded(false);
    } catch {
      // handled by mutation meta
    } finally {
      setExecuting(false);
    }
  };

  const handleRevert = async () => {
    setReverting(true);
    try {
      for (const check of affectedChecks) {
        if (isDelete) {
          // Can't revert deletes
          continue;
        }
        if (!check.enabled) {
          await updateCheck({ ...check, enabled: true });
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights }),
        queryClient.invalidateQueries({ queryKey: CHECK_QUERY_KEYS.list }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: INSIGHTS_QUERY_KEYS.insights }),
        queryClient.refetchQueries({ queryKey: CHECK_QUERY_KEYS.list }),
      ]);
      setDone(false);
    } catch {
      // handled by mutation meta
    } finally {
      setReverting(false);
    }
  };

  if (affectedChecks.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div className={styles.recoItem}>
        <span className={styles.recoItemLabel}>{action.label}</span>
        {done ? (
          <Stack direction="row" gap={1} alignItems="center">
            <span className={styles.recoNewValue}>Applied</span>
            {!isDelete && (
              <Button size="sm" variant="secondary" fill="text" onClick={handleRevert} disabled={reverting}>
                {reverting ? 'Reverting...' : 'Undo'}
              </Button>
            )}
          </Stack>
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
              This will {verb.toLowerCase()} the following {affectedChecks.length} check{affectedChecks.length !== 1 ? 's' : ''}:
            </span>
            {affectedChecks.map((c) => (
              <Stack key={c.id} direction="row" gap={0.5} alignItems="center">
                <span className={styles.recoItemLabel}>
                  {c.job}
                  <a href={`${CHECKS_URL}/${c.id}/edit`} target="_blank" rel="noreferrer" className={styles.dashboardLink} onClick={(e) => e.stopPropagation()}>
                    <Icon name="external-link-alt" size="xs" />
                  </a>
                </span>
                <Badge text={c.enabled ? 'enabled' : 'disabled'} color={c.enabled ? 'green' : 'orange'} />
              </Stack>
            ))}
            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Button size="sm" variant="secondary" fill="text" onClick={() => setExpanded(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleConfirm} disabled={executing}>
                {executing ? 'Applying...' : `${verb} ${affectedChecks.length} checks`}
              </Button>
            </Stack>
          </Stack>
        </div>
      )}
    </div>
  );
}

export function InlineRecommendation({
  prompt,
  systemPrompt,
  origin,
  allChecks,
  onClose,
}: {
  prompt: string;
  systemPrompt: string;
  origin: string;
  allChecks?: Check[];
  onClose: () => void;
}) {
  const { generate, isGenerating, content, error, cancel, reset } = useInlineAssistant();
  const styles = useStyles2(getStyles);
  const hasStarted = React.useRef(false);

  React.useEffect(() => {
    if (hasStarted.current) {
      return;
    }
    hasStarted.current = true;
    generate({ prompt, origin, systemPrompt });
  }, [generate, prompt, origin, systemPrompt]);

  const { markdown, actions: rawActions } = content ? parseContent(content) : { markdown: '', actions: [] };
  const actionableActions = allChecks
    ? rawActions.filter((a) => a.check_ids.some((id) => allChecks.find((c) => c.id === id)))
    : [];
  const showActions = !isGenerating && allChecks && actionableActions.length > 0;

  return (
    <div className={styles.inlineInvestigation}>
      <div className={styles.investigateHeader}>
        <Stack direction="row" gap={0.5} alignItems="center">
          <Icon name="ai-sparkle" size="sm" />
          <span className={styles.investigateTitle}>Recommendation</span>
        </Stack>
        <IconButton name="times" size="sm" aria-label="Close" onClick={() => { cancel(); onClose(); reset(); }} />
      </div>
      {isGenerating && !content && <LoadingPlaceholder text="Analyzing..." />}
      {markdown && (
        <div
          className={styles.investigateContent}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(markdown) as string) }}
        />
      )}
      {showActions && (
        <Stack direction="column" gap={0.5}>
          {actionableActions.map((action) => (
            <ActionRow key={`${action.action}-${action.check_ids.join(',')}`} action={action} allChecks={allChecks!} />
          ))}
        </Stack>
      )}
      {error && <span className={styles.mutedText}>Recommendation unavailable</span>}
    </div>
  );
}
