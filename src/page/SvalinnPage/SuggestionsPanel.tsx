import React, { type ReactElement, useCallback, useEffect, useState } from 'react';
import type { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { firstValueFrom } from 'rxjs';

import type { Suggestion, TestCategory } from './svalinn.types';

const THINKING_PHRASES = [
  'Consulting the observability oracle...',
  'Reading between the stack traces...',
  'Interrogating the incident logs...',
  'Connecting the dots across your incidents...',
  'Summoning test coverage wisdom...',
  'Brewing suggestions from your telemetry...',
  'Asking the AI very nicely...',
];

function useThinkingPhrase(): string {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % THINKING_PHRASES.length), 20000);
    return () => clearInterval(id);
  }, []);
  return THINKING_PHRASES[index];
}

interface Props {
  suggestions: Suggestion[];
  isGenerating?: boolean;
  error?: string | null;
  onDismiss: (suggestion: Suggestion) => void;
  onCreateTest: (suggestion: Suggestion) => void;
}

export function SuggestionsPanel({ suggestions, isGenerating, error, onDismiss, onCreateTest }: Props): ReactElement {
  const styles = useStyles2(getStyles);
  const thinkingPhrase = useThinkingPhrase();

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.aiLabel}>
          <span className={styles.sparkle}>✨</span> AI-generated suggestions based on your incidents
        </span>
      </div>
      {error && <div className={styles.state}>{error}</div>}
      {!isGenerating && !error && suggestions.length === 0 && (
        <div className={styles.state}>No suggestions available.</div>
      )}
      {suggestions.map((suggestion) => (
        <SuggestionRow
          key={suggestion.incident}
          suggestion={suggestion}
          onDismiss={onDismiss}
          onCreateTest={onCreateTest}
        />
      ))}
      {isGenerating && (
        <div className={styles.state}>
          <Spinner size="lg" />
          <span className={styles.thinkingPhrase}>{thinkingPhrase}</span>
        </div>
      )}
    </div>
  );
}

const BASE_URL = '/api/plugins/grafana-irm-app/resources/svalinn';

function SuggestionRow({
  suggestion,
  onDismiss,
  onCreateTest,
}: {
  suggestion: Suggestion;
  onDismiss: (suggestion: Suggestion) => void;
  onCreateTest: (suggestion: Suggestion) => void;
}): ReactElement {
  const styles = useStyles2(getStyles);
  const [isPosting, setIsPosting] = useState(false);

  const handleCreateTest = useCallback(async () => {
    setIsPosting(true);
    try {
      const resp = await firstValueFrom(
        getBackendSrv().fetch<{ id: number }>({
          method: 'POST',
          url: `${BASE_URL}/api/v1/suggestions`,
          data: { description: suggestion.description },
        })
      );
      const { id } = resp.data;
      onCreateTest(suggestion);
      window.location.href = `/a/grafana-synthetic-monitoring-app/checks/new/scripted?svalinn-id=${id}&svalinn-name=${encodeURIComponent(`Shield: ${suggestion.incident}`)}&svalinn_incidents_covered=${suggestion.incidentsCovered}`;
    } finally {
      setIsPosting(false);
    }
  }, [suggestion, onCreateTest]);

  return (
    <div className={styles.row}>
      <span
        className={`${styles.severityDot} ${suggestion.severity === 'critical' ? styles.dotCritical : styles.dotWarning}`}
      />
      <div className={styles.content}>
        <div className={styles.incident}>{suggestion.incident}</div>
        <div className={styles.description}>{suggestion.description}</div>
        <div className={styles.aiHint}>
          <span className={styles.sparkle}>✨</span> {suggestion.aiHint}
        </div>
      </div>
      <CategoryTag category={suggestion.category} />
      <button
        className={styles.aiButton}
        style={{
          background: 'linear-gradient(135deg, #6c3fb5, #e04d8a, #f08c00)',
          boxShadow: '0 0 8px rgba(192, 80, 160, 0.25)',
        }}
        onClick={handleCreateTest}
        disabled={isPosting}
      >
        <span className={styles.sparkle}>✨</span> {suggestion.actionLabel}
      </button>
      <button className={styles.dismissButton} onClick={() => onDismiss(suggestion)} aria-label="Dismiss suggestion">
        ✕
      </button>
    </div>
  );
}

export function CategoryTag({ category }: { category: TestCategory }): ReactElement {
  const styles = useStyles2(getStyles);
  return <span className={`${styles.tag} ${styles[`tag_${category}`]}`}>{capitalize(category)}</span>;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getStyles(theme: GrafanaTheme2) {
  return {
    panel: css({
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderLeft: `3px solid ${theme.colors.warning.border}`,
      borderRadius: theme.shape.radius.default,
      overflow: 'hidden',
    }),
    header: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${theme.spacing(1.25)} ${theme.spacing(2)}`,
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      background: 'linear-gradient(90deg, rgba(108, 63, 181, 0.08), rgba(224, 77, 138, 0.06), transparent)',
    }),
    aiLabel: css({
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(0.625),
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: '#c490f5',
    }),
    sparkle: css({
      fontSize: '13px',
      lineHeight: 1,
    }),
    row: css({
      display: 'flex',
      alignItems: 'center',
      padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
      gap: theme.spacing(1.5),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      transition: 'background 0.15s',
      '&:last-child': { borderBottom: 'none' },
      '&:hover': { background: theme.colors.background.secondary },
    }),
    severityDot: css({
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      flexShrink: 0,
    }),
    dotCritical: css({ background: theme.colors.error.main }),
    dotWarning: css({ background: theme.colors.warning.main }),
    content: css({ flex: 1, minWidth: 0 }),
    incident: css({
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(0.25),
    }),
    description: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
    }),
    aiHint: css({
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      fontSize: theme.typography.bodySmall.fontSize,
      color: '#c490f5',
      marginTop: theme.spacing(0.375),
    }),
    tag: css({
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: theme.typography.fontWeightMedium,
      padding: `2px ${theme.spacing(1)}`,
      borderRadius: '3px',
      whiteSpace: 'nowrap',
    }),
    tag_performance: css({ background: '#1a3a2a', color: '#6ccf59' }),
    tag_availability: css({ background: '#1a2a3a', color: '#6e9fff' }),
    tag_fallback: css({ background: '#3a2a1a', color: '#ff9830' }),
    tag_latency: css({ background: '#2a1a3a', color: '#c490f5' }),
    state: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(1.5),
      padding: theme.spacing(3),
      color: theme.colors.text.secondary,
    }),
    thinkingPhrase: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: '#c490f5',
      fontStyle: 'italic',
    }),
    dismissButton: css({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      padding: 0,
      fontSize: '12px',
      color: theme.colors.text.disabled,
      background: 'transparent',
      border: 'none',
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
      flexShrink: 0,
      '&:hover': {
        color: theme.colors.text.primary,
        background: theme.colors.background.secondary,
      },
    }),
    aiButton: css({
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(0.625),
      padding: `${theme.spacing(0.75)} ${theme.spacing(1.75)}`,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: '#fff',
      border: 'none',
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'filter 0.15s, box-shadow 0.15s',
      '&:hover': {
        filter: 'brightness(1.12)',
        boxShadow: '0 0 14px rgba(192, 80, 160, 0.4)',
      },
    }),
  };
}
