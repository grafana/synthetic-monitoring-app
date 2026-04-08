import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  Alert,
  Button,
  ComboboxOption,
  Field,
  Input,
  Modal,
  MultiCombobox,
  Stack,
  Text,
  TextLink,
  useStyles2,
} from '@grafana/ui';
import { css } from '@emotion/css';
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
import { sanitizeLabelValue } from 'utils';
import { useCreateGrafanaSlo } from 'data/useCreateGrafanaSlo';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { CopyToClipboard } from 'components/Clipboard/CopyToClipboard';
import { Feedback } from 'components/Feedback';
import { SubCollapse } from 'components/SubCollapse';

const GRAFANA_SLO_CREATE = 'https://grafana.com/docs/grafana-cloud/alerting-and-irm/slo/create/';
const GRAFANA_SLO_HTTP_API_DOCS =
  'https://grafana.com/docs/grafana-cloud/alerting-and-irm/slo/set-up/api/';
const SLO_OPENAPI_REPO = 'https://github.com/grafana/slo-openapi-client/blob/main/openapi.yaml';
const SM_UPTIME_DOCS = 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/analyze-results/uptime-and-reachability/'

/** Aligned with grafana/terraform-provider-grafana SLO name validation (max 128). */
const MAX_SLO_NAME = 128;

const DEFAULT_SLO_TARGET_PERCENT = '99.5';
const DEFAULT_SLO_WINDOW_DAYS = '28';

function defaultSloNameForJob(job: string): string {
  const prefix = 'SLO: ';
  const maxJob = MAX_SLO_NAME - prefix.length;
  if (job.length <= maxJob) {
    return `${prefix}${job}`;
  }
  return `${prefix}${job.slice(0, Math.max(0, maxJob - 1))}…`;
}

function defaultSloGroupNameForJob(job: string): string {
  const prefix = 'SLO Group: ';
  const maxJob = MAX_SLO_NAME - prefix.length;
  if (job.length <= maxJob) {
    return `${prefix}${job}`;
  }
  return `${prefix}${job.slice(0, Math.max(0, maxJob - 1))}…`;
}

/** Grafana SLO plugin dashboard for a single SLO (uid from create response). */
function grafanaSloDetailDashboardHref(sloUuid: string): string {
  const base = config.appSubUrl ?? '';
  return `${base}/d/grafana_slo_app-${sloUuid}/`;
}

function parseSloTargetPercent(input: string): { ok: true; fraction: number } | { ok: false; message: string } {
  const n = parseFloat(input.trim().replace(/,/g, '').replace(/%/g, ''));
  if (!Number.isFinite(n) || n <= 0 || n >= 100) {
    return { ok: false, message: 'SLO target must be a percentage between 0 and 100 (e.g. 99.5).' };
  }
  return { ok: true, fraction: n / 100 };
}

function parseSloWindowDays(input: string): { ok: true; window: string } | { ok: false; message: string } {
  const n = parseInt(input.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 3650) {
    return { ok: false, message: 'Window must be a whole number of days between 1 and 3650.' };
  }
  return { ok: true, window: `${n}d` };
}

type CheckSloQueriesModalProps = {
  check: Check;
  isOpen: boolean;
  onDismiss: () => void;
};

type CreateFeedback = { kind: 'success'; uuid: string; name: string } | { kind: 'error'; message: string } | null;

function labelsSignature(labels: Check['labels']): string {
  return labels.map((l) => `${l.name}\0${l.value}`).join('\n');
}

function truncateSloName(name: string, fallback: string): string {
  const t = name.trim() || fallback;
  if (t.length <= MAX_SLO_NAME) {
    return t;
  }
  return `${t.slice(0, MAX_SLO_NAME - 1)}…`;
}

function sloProvenanceLabels(check: Check): Array<{ key: string; value: string }> {
  const labels: Array<{ key: string; value: string }> = [{ key: 'source', value: 'grafana-synthetic-monitoring-app' }];
  if (check.id != null) {
    labels.push({ key: 'sm_check_id', value: String(check.id) });
  }
  const job = check.job.length > 150 ? `${check.job.slice(0, 149)}…` : check.job;
  labels.push({ key: 'sm_check_job', value: sanitizeLabelValue(job) });
  return labels;
}

export function CheckSloQueriesModal({ check, isOpen, onDismiss }: CheckSloQueriesModalProps) {
  const styles = useStyles2(getStyles);
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

  const groupedQueries = useMemo(() => {
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
    if (Object.keys(matchers).length === 0) {
      return null;
    }
    try {
      return buildSmCheckInfoFilteredReachabilitySloAggregatedQueries(matchers);
    } catch {
      return null;
    }
  }, [selectedLabelIndices, check.labels]);

  const groupedSloApiQuery = useMemo((): SloApiQuerySpec | null => {
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
    if (Object.keys(matchers).length === 0) {
      return null;
    }
    try {
      return buildLabelGroupedSloApiFreeformQuery(matchers);
    } catch {
      return null;
    }
  }, [selectedLabelIndices, check.labels]);

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

  return (
    <Modal
      title={
        <div className={styles.modalHeader}>
          <Text variant="h4">Create a SLO</Text>
          <Feedback feature="create-slo" about={{ text: 'Experimental' }} />
        </div>
      }
      ariaLabel="Create a SLO"
      isOpen={isOpen}
      onDismiss={onDismiss}
      className={styles.modal}
    >
      <Stack direction="column" gap={2}>
        <Text color="secondary">
          Create a Grafana Cloud SLO from Synthetic Monitoring reachability metrics (<code>probe_all_success_*</code>).
          This is not the same as in-app &quot;uptime&quot; — see{' '}
          <TextLink href={SM_UPTIME_DOCS} external>
            Synthetic Monitoring docs
          </TextLink>
          .
        </Text>

        {!canCreateSlo && (
          <Alert severity="warning" title="Create SLO disabled">
            No linked metrics datasource UID was found. Configure Synthetic Monitoring metrics in the plugin config.
          </Alert>
        )}

        {feedback?.kind === 'success' && (
          <Alert severity="success" title="SLO creation accepted">
            <Stack direction="column" gap={1}>
              <Text>
                {feedback.name} — id <code>{feedback.uuid}</code>
              </Text>
              <TextLink href={grafanaSloDetailDashboardHref(feedback.uuid)} external>
                Open this SLO
              </TextLink>
            </Stack>
          </Alert>
        )}

        {feedback?.kind === 'error' && (
          <Alert severity="error" title="Could not create SLO">
            {feedback.message}
            {feedback.message.toLowerCase().includes('404') || feedback.message.includes('Not Found') ? (
              <Text color="secondary">
                The SLO plugin may be missing on this stack, or the resource path may differ from this prototype.
              </Text>
            ) : null}
          </Alert>
        )}

        <Stack direction="row" gap={2}>
          <Field
            label="SLO target"
            description="Target availability as a percentage (same idea as the SLO app), e.g. 99.5."
            className={styles.objectiveField}
          >
            <Input
              type="text"
              inputMode="decimal"
              aria-label="SLO target percent"
              value={sloTargetPercent}
              onChange={(e) => setSloTargetPercent(e.currentTarget.value)}
              disabled={!canCreateSlo}
              placeholder={DEFAULT_SLO_TARGET_PERCENT}
            />
          </Field>
          <Field
            label="Error budget window"
            description="Rolling window length in days (sent to the API as e.g. 28d), matching the SLO app default of 28."
            className={styles.objectiveField}
          >
            <Input
              type="text"
              inputMode="numeric"
              aria-label="SLO window days"
              value={sloWindowDays}
              onChange={(e) => setSloWindowDays(e.currentTarget.value)}
              disabled={!canCreateSlo}
              placeholder={DEFAULT_SLO_WINDOW_DAYS}
            />
          </Field>
        </Stack>

        <Text variant="h5">This check only</Text>
        <Text color="secondary">
          One SLO for <strong>this</strong> check (job + instance). <strong>Create</strong> uses the Grafana SLO API{' '}
          <code>ratio</code> type: bare success/total counter selectors; Grafana applies rate and grouping. For the UI
          flow or Explore, see{' '}
          <TextLink href={GRAFANA_SLO_CREATE} external>
            Create SLOs in Grafana Cloud
          </TextLink>
          .
        </Text>
        <Field label="SLO name">
          <Input
            value={singleSloName}
            onChange={(e) => setSingleSloName(e.currentTarget.value)}
            disabled={!canCreateSlo}
          />
        </Field>
        <Button
          variant="primary"
          disabled={!canCreateSlo || isPending}
          onClick={() =>
            runCreate({
              nameDefault: defaultSloNameForJob(check.job),
              nameInput: singleSloName,
              sloQuery: singleSloApiQuery,
            })
          }
        >
          Create a SLO
        </Button>

        <SubCollapse title="PromQL for Explore or manual SLO editor (this check)">
          <Stack direction="column" gap={1}>
            <Text color="secondary">
              Three copyable queries: combined ratio, numerator only, denominator only. They are not identical to the API{' '}
              <code>ratio</code> payload (which omits <code>rate</code> / <code>sum</code>).
            </Text>
            <PromqlBlock label="Ratio (combined)" code={single.ratio} styles={styles} />
            <PromqlBlock label="Success (numerator)" code={single.successQuery} styles={styles} />
            <PromqlBlock label="Total attempts (denominator)" code={single.totalQuery} styles={styles} />
          </Stack>
        </SubCollapse>

        {check.labels.length > 0 ? (
          <>
            <Text variant="h5">All checks matching these labels</Text>
            <Text color="secondary">
              One combined reachability SLI across every Synthetic Monitoring check whose <code>sm_check_info</code>{' '}
              matches the labels you pick (<strong>AND</strong>). Probe volumes are weighted by how often each check
              runs. <strong>Create</strong> uses the API <code>freeform</code> query type (full PromQL with joins). For
              only this check, use the section above.
            </Text>
            <Field
              label="Labels to match"
              description="Defaults to all labels on this check when you open the dialog; remove any you do not want in the filter."
            >
              <MultiCombobox
                options={labelOptions}
                value={selectedLabelIndices}
                placeholder="Select labels"
                isClearable
                onChange={(selected: Array<ComboboxOption<string>>) =>
                  setSelectedLabelIndices(selected.map((o) => o.value ?? '').filter(Boolean))
                }
              />
            </Field>
            {groupedQueries ? (
              <>
                <Field label="SLO name">
                  <Input
                    value={groupSloName}
                    onChange={(e) => setGroupSloName(e.currentTarget.value)}
                    disabled={!canCreateSlo}
                  />
                </Field>
                <Button
                  variant="primary"
                  disabled={!canCreateSlo || isPending || !groupedSloApiQuery}
                  onClick={() =>
                    groupedSloApiQuery &&
                    runCreate({
                      nameDefault: defaultSloGroupNameForJob(check.job),
                      nameInput: groupSloName,
                      sloQuery: groupedSloApiQuery,
                    })
                  }
                >
                  Create a SLO (label group)
                </Button>

                <SubCollapse title="PromQL for Explore or manual SLO editor (label group)">
                  <Stack direction="column" gap={1}>
                    <PromqlBlock
                      label="Ratio (combined across matching checks)"
                      code={groupedQueries.ratio}
                      styles={styles}
                    />
                    <PromqlBlock label="Success (numerator)" code={groupedQueries.successQuery} styles={styles} />
                    <PromqlBlock label="Total attempts (denominator)" code={groupedQueries.totalQuery} styles={styles} />
                  </Stack>
                </SubCollapse>
              </>
            ) : (
              <Alert severity="info" title="Select at least one label">
                Choose one or more labels to enable group creation and PromQL.
              </Alert>
            )}
          </>
        ) : (
          <Alert severity="warning" title="Label group needs custom labels">
            Add custom labels on the check to build a group SLO that filters <code>sm_check_info</code>.
          </Alert>
        )}

        <SubCollapse title="API details and references">
          <Stack direction="column" gap={1}>
            <Text color="secondary">
              The SLO UI accepts rich PromQL; the HTTP API uses either <code>ratio</code> (bare counter selectors — rate
              and aggregations come from <code>groupByLabels</code>) or <code>freeform</code> (one expression). See the{' '}
              <TextLink href={GRAFANA_SLO_HTTP_API_DOCS} external>
                SLO HTTP API docs
              </TextLink>{' '}
              and{' '}
              <TextLink href={SLO_OPENAPI_REPO} external>
                OpenAPI spec
              </TextLink>
              .
            </Text>
          </Stack>
        </SubCollapse>
      </Stack>
    </Modal>
  );
}

function PromqlBlock({ label, code, styles }: { label: string; code: string; styles: ReturnType<typeof getStyles> }) {
  return (
    <div>
      <Text variant="bodySmall">{label}</Text>
      <div className={styles.block}>
        <pre className={styles.pre}>{code.trim()}</pre>
        <CopyToClipboard
          content={code.trim()}
          buttonText="Copy"
          buttonTextCopied="Copied"
          fill="outline"
          variant="secondary"
        />
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css`
    width: min(720px, 95vw);

    > :first-child {
      border-bottom: none;
    }
  `,
  modalHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    margin-left: ${theme.spacing(1)};
    margin-top: ${theme.spacing(2)};
  `,
  objectiveField: css`
    flex: 1;
    min-width: 140px;
  `,
  block: css`
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: flex-start;
    margin-top: ${theme.spacing(0.5)};
  `,
  pre: css`
    flex: 1;
    margin: 0;
    padding: ${theme.spacing(1)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 220px;
    overflow: auto;
  `,
});
