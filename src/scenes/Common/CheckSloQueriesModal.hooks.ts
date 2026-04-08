import { useCallback, useEffect, useMemo, useState } from 'react';
import { ComboboxOption } from '@grafana/ui';
import {
  buildSingleCheckReachabilitySloQueries,
  buildSmCheckInfoFilteredReachabilitySloAggregatedQueries,
  checkLabelNameToSmCheckInfoKey,
} from 'queries/sloPromql';
import {
  buildReachabilitySloCreateRequest,
  type SloApiQuerySpec,
} from 'slo/buildReachabilitySloCreateRequest';
import { GrafanaSloApiError } from 'slo/createGrafanaSlo';
import {
  buildLabelGroupedSloApiFreeformQuery,
  buildSingleCheckSloApiQuery,
} from 'slo/grafanaSloReachabilityQueries';

import { Check } from 'types';
import { useCreateGrafanaSlo } from 'data/useCreateGrafanaSlo';
import { useMetricsDS } from 'hooks/useMetricsDS';

import {
  DEFAULT_SLO_TARGET_PERCENT,
  DEFAULT_SLO_WINDOW_DAYS,
  defaultSloGroupNameForJob,
  defaultSloNameForJob,
  labelsSignature,
  parseSloTargetPercent,
  parseSloWindowDays,
  sloProvenanceLabels,
  truncateSloName,
} from './CheckSloQueriesModal.utils';

export type CreateFeedback =
  | { kind: 'success'; uuid: string; name: string }
  | { kind: 'error'; message: string }
  | null;

export function useCheckSloModal(check: Check, isOpen: boolean) {
  const metricsDS = useMetricsDS();
  const { mutateAsync, isPending, reset: resetMutation } = useCreateGrafanaSlo();

  const [selectedLabelIndices, setSelectedLabelIndices] = useState<string[]>([]);
  const [singleSloName, setSingleSloName] = useState('');
  const [groupSloName, setGroupSloName] = useState('');
  const [sloTargetPercent, setSloTargetPercent] = useState(DEFAULT_SLO_TARGET_PERCENT);
  const [sloWindowDays, setSloWindowDays] = useState(DEFAULT_SLO_WINDOW_DAYS);
  const [feedback, setFeedback] = useState<CreateFeedback>(null);

  const labelOptions = useMemo<Array<ComboboxOption<string>>>(
    () =>
      check.labels.map((l, i) => ({
        label: `${l.name}: ${l.value}`,
        value: String(i),
      })),
    [check.labels]
  );

  const labelsKey = labelsSignature(check.labels);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setSelectedLabelIndices(check.labels.map((_, i) => String(i)));
    setSingleSloName(defaultSloNameForJob(check.job));
    setGroupSloName(defaultSloGroupNameForJob(check.job));
    setSloTargetPercent(DEFAULT_SLO_TARGET_PERCENT);
    setSloWindowDays(DEFAULT_SLO_WINDOW_DAYS);
    setFeedback(null);
    resetMutation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labelsKey reflects check.labels; omit check.labels to avoid resets on reference-only churn
  }, [isOpen, check.id, labelsKey, resetMutation]);

  const single = useMemo(
    () => buildSingleCheckReachabilitySloQueries(check.job, check.target),
    [check.job, check.target]
  );

  const singleSloApiQuery = useMemo(
    () => buildSingleCheckSloApiQuery(check.job, check.target),
    [check.job, check.target]
  );

  const selectedMatchers = useMemo((): Record<string, string> | null => {
    if (selectedLabelIndices.length === 0) {
      return null;
    }
    const matchers: Record<string, string> = {};
    for (const idx of selectedLabelIndices) {
      const label = check.labels[Number(idx)];
      if (!label) {
        continue;
      }
      matchers[checkLabelNameToSmCheckInfoKey(label.name)] = label.value;
    }
    return Object.keys(matchers).length === 0 ? null : matchers;
  }, [selectedLabelIndices, check.labels]);

  const groupedQueries = useMemo(() => {
    if (!selectedMatchers) {
      return null;
    }
    try {
      return buildSmCheckInfoFilteredReachabilitySloAggregatedQueries(selectedMatchers);
    } catch {
      return null;
    }
  }, [selectedMatchers]);

  const groupedSloApiQuery = useMemo((): SloApiQuerySpec | null => {
    if (!selectedMatchers) {
      return null;
    }
    try {
      return buildLabelGroupedSloApiFreeformQuery(selectedMatchers);
    } catch {
      return null;
    }
  }, [selectedMatchers]);

  const canCreateSlo = Boolean(metricsDS?.uid);

  const runCreate = useCallback(
    async (args: { nameDefault: string; nameInput: string; sloQuery: SloApiQuerySpec }) => {
      if (!metricsDS?.uid) {
        setFeedback({ kind: 'error', message: 'Metrics datasource is not configured for this stack.' });
        return;
      }
      setFeedback(null);
      const name = truncateSloName(args.nameInput, args.nameDefault);
      const description = `Reachability SLI from Synthetic Monitoring (probe_all_success_*). Check: ${check.job}`;
      const parsedTarget = parseSloTargetPercent(sloTargetPercent);
      if (!parsedTarget.ok) {
        setFeedback({ kind: 'error', message: parsedTarget.message });
        return;
      }
      const parsedWindow = parseSloWindowDays(sloWindowDays);
      if (!parsedWindow.ok) {
        setFeedback({ kind: 'error', message: parsedWindow.message });
        return;
      }
      const body = buildReachabilitySloCreateRequest({
        name,
        description,
        metricsDatasourceUid: metricsDS.uid,
        sloQuery: args.sloQuery,
        objective: { value: parsedTarget.fraction, window: parsedWindow.window },
        labels: sloProvenanceLabels(check),
      });
      try {
        const res = await mutateAsync(body);
        setFeedback({ kind: 'success', uuid: res.uuid, name });
      } catch (e: unknown) {
        const message =
          e instanceof GrafanaSloApiError ? e.message : e instanceof Error ? e.message : 'Failed to create SLO';
        setFeedback({ kind: 'error', message });
      }
    },
    [check, metricsDS, mutateAsync, sloTargetPercent, sloWindowDays]
  );

  return {
    singleSloName,
    setSingleSloName,
    groupSloName,
    setGroupSloName,
    sloTargetPercent,
    setSloTargetPercent,
    sloWindowDays,
    setSloWindowDays,
    selectedLabelIndices,
    setSelectedLabelIndices,
    feedback,
    labelOptions,
    single,
    singleSloApiQuery,
    groupedQueries,
    groupedSloApiQuery,
    canCreateSlo,
    isPending,
    runCreate,
  };
}
