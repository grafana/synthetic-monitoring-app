import React from 'react';
import { type ReactElement, useMemo, useState } from 'react';
import type { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useChecks } from 'data/useChecks';
import { getCheckType } from 'utils';
import { CheckType } from 'types';
import type { Check } from 'types';

import type { StatCard, TestEntry, TestCategory, TestProduct } from './svalinn.types';

import { ImmunityCallout } from './ImmunityCallout';
import { StatCardsRow } from './StatCardsRow';
import { SuggestionsPanel } from './SuggestionsPanel';
import { TestSuiteTable } from './TestSuiteTable';
import type { TestSuggestion } from './useTestSuggestions';
import { useTestSuggestions } from './useTestSuggestions';

function checkToTestEntry(check: Check): TestEntry {
  const checkType = getCheckType(check.settings);
  const isK6 = checkType === CheckType.Scripted || checkType === CheckType.Browser;

  const product: TestProduct = isK6 ? 'k6' : 'synthetics';
  const type: TestCategory = isK6 ? 'performance' : 'availability';

  const lastRun = check.modified
    ? new Date(check.modified * 1000).toLocaleDateString()
    : '—';

  const incLabel = check.labels.find((l) => l.name === 'svalinn-incidents-covered');
  const incidentsCovered = incLabel ? Number(incLabel.value) : undefined;

  return {
    status: check.enabled ? 'pass' : 'fail',
    name: check.job,
    type,
    product,
    linkedIncident: null,
    lastRun,
    incidentsCovered,
  };
}

export function SvalinnPage(): ReactElement {
  const styles = useStyles2(getStyles);
  const { suggestions, isGenerating, error, dismiss } = useTestSuggestions();
  const { data: allChecks } = useChecks();
  const [extraEntries, setExtraEntries] = useState<TestEntry[]>([]);

  const fetchedEntries = useMemo(() => {
    if (!allChecks) {
      return [];
    }
    return allChecks
      .filter((check) => check.labels.some((l) => l.name === 'shield' && l.value === 'svalinn'))
      .map(checkToTestEntry);
  }, [allChecks]);

  const testEntries = [...fetchedEntries, ...extraEntries];

  const incidentsCovered = testEntries.reduce((sum, e) => sum + (e.incidentsCovered ?? 0), 0);

  const statCards: StatCard[] = [
    { label: 'Suggestions', value: suggestions.length, detail: 'pending review', status: 'warning' },
    { label: 'Active Tests', value: testEntries.length, detail: 'running', status: 'success' },
    { label: 'Incidents Covered', value: incidentsCovered, detail: 'would be prevented', status: 'info' },
  ];

  const createTest = (suggestion: TestSuggestion): void => {
    const entry: TestEntry = {
      status: 'pass',
      name: suggestion.description,
      type: suggestion.category,
      product: 'k6',
      linkedIncident: suggestion.incident,
      lastRun: new Date().toISOString(),
      incidentsCovered: suggestion.incidentsCovered,
    };
    setExtraEntries((prev) => [...prev, entry]);
    dismiss(suggestion);
  };

  return (
    <PluginPage pageNav={{ text: 'Svalinn' }}>
      <p className={styles.subtitle}>
        Incident immunity system — automates learning from incidents and protecting against regressions
      </p>

      <StatCardsRow cards={statCards} />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Suggestions</h2>
          <span className={styles.sectionSubtitle}>Based on recent incidents</span>
        </div>
        <SuggestionsPanel
          suggestions={suggestions}
          isGenerating={isGenerating}
          error={error}
          onDismiss={dismiss}
          onCreateTest={createTest}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Automatic Test Suite</h2>
          <span className={styles.sectionSubtitle}>{testEntries.length} tests active</span>
        </div>
        <TestSuiteTable entries={testEntries} />
        <ImmunityCallout />
      </div>
    </PluginPage>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    subtitle: css({
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing(3),
    }),
    section: css({
      marginBottom: theme.spacing(3.5),
    }),
    sectionHeader: css({
      display: 'flex',
      alignItems: 'baseline',
      gap: theme.spacing(1.5),
      marginBottom: theme.spacing(1.5),
    }),
    sectionTitle: css({
      fontSize: '18px',
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
      margin: 0,
    }),
    sectionSubtitle: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.disabled,
    }),
  };
}

export default SvalinnPage;
