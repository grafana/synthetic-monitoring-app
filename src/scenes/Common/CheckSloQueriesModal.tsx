import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  Alert,
  Button,
  Combobox,
  ComboboxOption,
  Field,
  Input,
  Modal,
  MultiCombobox,
  Stack,
  Tab,
  TabContent,
  TabsBar,
  Text,
  TextLink,
  useStyles2,
} from '@grafana/ui';
import { css } from '@emotion/css';
import type { ReachabilitySloQueries } from 'queries/sloPromql';
import type { SloApiQuerySpec } from 'slo/buildReachabilitySloCreateRequest';

import { Check } from 'types';
import { CopyToClipboard } from 'components/Clipboard/CopyToClipboard';
import { Feedback } from 'components/Feedback';
import { SubCollapse } from 'components/SubCollapse';

import { useCheckSloModal } from './CheckSloQueriesModal.hooks';
import {
  DEFAULT_SLO_TARGET_PERCENT,
  DEFAULT_SLO_WINDOW_DAYS,
  defaultSloGroupNameForJob,
  defaultSloNameForJob,
  GRAFANA_SLO_CREATE,
  GRAFANA_SLO_HTTP_API_DOCS,
  grafanaSloDetailDashboardHref,
  grafanaSloWizardReviewHref,
  isSloWindowDaysChoice,
  SHOW_LABEL_GROUP_SLO,
  SLO_OPENAPI_REPO,
  type SloWindowDaysChoice,
  SM_UPTIME_DOCS,
} from './CheckSloQueriesModal.utils';

const SLO_WINDOW_COMBO_OPTIONS: Array<ComboboxOption<SloWindowDaysChoice>> = [
  { label: '7 days', value: '7' },
  { label: '14 days', value: '14' },
  { label: '28 days', value: '28' },
];

type CheckSloQueriesModalProps = {
  check: Check;
  isOpen: boolean;
  onDismiss: () => void;
};

const SLO_TABS = ['This check', 'Label group'] as const;
type SloTab = (typeof SLO_TABS)[number];

export function CheckSloQueriesModal({ check, isOpen, onDismiss }: CheckSloQueriesModalProps) {
  const styles = useStyles2(getStyles);
  const [activeTab, setActiveTab] = useState<SloTab>('This check');
  const {
    singleSloName,
    setSingleSloName,
    groupSloName,
    setGroupSloName,
    sloTargetPercent,
    setSloTargetPercent,
    sloWindowChoice,
    setSloWindowChoice,
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
  } = useCheckSloModal(check, isOpen);

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
          Define a Grafana Cloud SLO based on probe reachability metrics (<code>probe_all_success_*</code>).
          This measures whether probes can reach the target, which differs from the in-app &quot;uptime&quot; metric. See{' '}
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
              <Text color="secondary">
                Configure burn-rate alerts, labels, and folders in the Grafana SLO app. Charts may look empty until
                enough data has accumulated.
              </Text>
              <Stack direction="row" gap={2}>
                <TextLink href={grafanaSloDetailDashboardHref(config.appSubUrl, feedback.uuid)} external>
                  View SLO results
                </TextLink>
                <TextLink href={grafanaSloWizardReviewHref(config.appSubUrl, feedback.uuid)} external>
                  Edit in Grafana SLO
                </TextLink>
              </Stack>
            </Stack>
          </Alert>
        )}

        {feedback?.kind === 'error' && (
          <Alert severity="error" title="Could not create SLO">
            <Stack direction="column" gap={1}>
              <Text>{feedback.message}</Text>
              {(feedback.message.toLowerCase().includes('404') || feedback.message.includes('Not Found')) && (
                <Text color="secondary">
                  The SLO plugin may not be installed on this stack, or its API path may have changed.
                </Text>
              )}
            </Stack>
          </Alert>
        )}

        <Stack direction="row" gap={2}>
          <Field
            label="Target"
            description="Availability % (Grafana SLO), e.g. 99.5."
            className={styles.objectiveField}
          >
            <Input
              type="text"
              inputMode="decimal"
              aria-label="Target percent"
              value={sloTargetPercent}
              onChange={(e) => setSloTargetPercent(e.currentTarget.value)}
              disabled={!canCreateSlo}
              placeholder={DEFAULT_SLO_TARGET_PERCENT}
            />
          </Field>
          <Field
            label="Error budget window"
            description="Rolling window (7, 14, or 28 days)."
            className={styles.objectiveField}
          >
            <Combobox
              aria-label="Error budget window"
              options={SLO_WINDOW_COMBO_OPTIONS}
              value={SLO_WINDOW_COMBO_OPTIONS.find((o) => o.value === sloWindowChoice) ?? SLO_WINDOW_COMBO_OPTIONS.find((o) => o.value === DEFAULT_SLO_WINDOW_DAYS)}
              width={24}
              disabled={!canCreateSlo}
              onChange={(opt) => {
                if (opt?.value != null && isSloWindowDaysChoice(String(opt.value))) {
                  setSloWindowChoice(opt.value);
                }
              }}
            />
          </Field>
        </Stack>

        {SHOW_LABEL_GROUP_SLO ? (
          <>
            <TabsBar>
              {SLO_TABS.map((tab) => (
                <Tab key={tab} label={tab} active={activeTab === tab} onChangeTab={() => setActiveTab(tab)} />
              ))}
            </TabsBar>
            <TabContent className={styles.tabContent}>
              {activeTab === 'This check' && (
                <ThisCheckForm
                  styles={styles}
                  check={check}
                  canCreateSlo={canCreateSlo}
                  isPending={isPending}
                  singleSloName={singleSloName}
                  setSingleSloName={setSingleSloName}
                  single={single}
                  singleSloApiQuery={singleSloApiQuery}
                  sloTargetPercent={sloTargetPercent}
                  sloWindowChoice={sloWindowChoice}
                  runCreate={runCreate}
                />
              )}

              {activeTab === 'Label group' && (
                <LabelGroupForm
                  styles={styles}
                  check={check}
                  canCreateSlo={canCreateSlo}
                  isPending={isPending}
                  groupSloName={groupSloName}
                  setGroupSloName={setGroupSloName}
                  labelOptions={labelOptions}
                  selectedLabelIndices={selectedLabelIndices}
                  setSelectedLabelIndices={setSelectedLabelIndices}
                  groupedQueries={groupedQueries}
                  groupedSloApiQuery={groupedSloApiQuery}
                  sloTargetPercent={sloTargetPercent}
                  sloWindowChoice={sloWindowChoice}
                  runCreate={runCreate}
                />
              )}
            </TabContent>
          </>
        ) : (
          <ThisCheckForm
            styles={styles}
            check={check}
            canCreateSlo={canCreateSlo}
            isPending={isPending}
            singleSloName={singleSloName}
            setSingleSloName={setSingleSloName}
            single={single}
            singleSloApiQuery={singleSloApiQuery}
            sloTargetPercent={sloTargetPercent}
            sloWindowChoice={sloWindowChoice}
            runCreate={runCreate}
          />
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

type RunCreateFn = (args: {
  nameDefault: string;
  nameInput: string;
  sloQuery: SloApiQuerySpec;
  targetPercent: string;
  windowChoice: SloWindowDaysChoice;
}) => Promise<void>;

function ThisCheckForm({
  styles,
  check,
  canCreateSlo,
  isPending,
  singleSloName,
  setSingleSloName,
  single,
  singleSloApiQuery,
  sloTargetPercent,
  sloWindowChoice,
  runCreate,
}: {
  styles: ReturnType<typeof getStyles>;
  check: Check;
  canCreateSlo: boolean;
  isPending: boolean;
  singleSloName: string;
  setSingleSloName: (v: string) => void;
  single: ReachabilitySloQueries;
  singleSloApiQuery: SloApiQuerySpec;
  sloTargetPercent: string;
  sloWindowChoice: SloWindowDaysChoice;
  runCreate: RunCreateFn;
}) {
  return (
    <Stack direction="column" gap={2}>
      <Text color="secondary">
        One SLO for <strong>this</strong> check (job + instance), using <strong>reachability</strong> (
        <code>probe_all_success_*</code>). Uses the Grafana SLO API <code>ratio</code> type. For the UI flow or
        Explore, see{' '}
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
        style={{ alignSelf: 'flex-start' }}
        onClick={() =>
          runCreate({
            nameDefault: defaultSloNameForJob(check.job),
            nameInput: singleSloName,
            sloQuery: singleSloApiQuery,
            targetPercent: sloTargetPercent,
            windowChoice: sloWindowChoice,
          })
        }
      >
        Create a SLO
      </Button>

      <SubCollapse title="PromQL for Explore or manual SLO editor">
        <Stack direction="column" gap={1}>
          <PromqlBlock label="Ratio (combined)" code={single.ratio} styles={styles} />
          <PromqlBlock label="Success (numerator)" code={single.successQuery} styles={styles} />
          <PromqlBlock label="Total attempts (denominator)" code={single.totalQuery} styles={styles} />
        </Stack>
      </SubCollapse>
    </Stack>
  );
}

function LabelGroupForm({
  styles,
  check,
  canCreateSlo,
  isPending,
  groupSloName,
  setGroupSloName,
  labelOptions,
  selectedLabelIndices,
  setSelectedLabelIndices,
  groupedQueries,
  groupedSloApiQuery,
  sloTargetPercent,
  sloWindowChoice,
  runCreate,
}: {
  styles: ReturnType<typeof getStyles>;
  check: Check;
  canCreateSlo: boolean;
  isPending: boolean;
  groupSloName: string;
  setGroupSloName: (v: string) => void;
  labelOptions: Array<ComboboxOption<string>>;
  selectedLabelIndices: string[];
  setSelectedLabelIndices: (v: string[]) => void;
  groupedQueries: ReachabilitySloQueries | null;
  groupedSloApiQuery: SloApiQuerySpec | null;
  sloTargetPercent: string;
  sloWindowChoice: SloWindowDaysChoice;
  runCreate: RunCreateFn;
}) {
  return (
    <Stack direction="column" gap={2}>
      {check.labels.length > 0 ? (
        <>
          <Text color="secondary">
            One combined reachability SLI across every check whose <code>sm_check_info</code> matches the labels you
            pick (<strong>AND</strong>). Uses the API <code>freeform</code> query type.
          </Text>
          <Field
            label="Labels to match"
            description="Defaults to all labels on this check; remove any you do not want in the filter."
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
                style={{ alignSelf: 'flex-start' }}
                onClick={() =>
                  groupedSloApiQuery &&
                  runCreate({
                    nameDefault: defaultSloGroupNameForJob(check.job),
                    nameInput: groupSloName,
                    sloQuery: groupedSloApiQuery,
                    targetPercent: sloTargetPercent,
                    windowChoice: sloWindowChoice,
                  })
                }
              >
                Create a SLO
              </Button>

              <SubCollapse title="PromQL for Explore or manual SLO editor">
                <Stack direction="column" gap={1}>
                  <PromqlBlock label="Ratio (combined)" code={groupedQueries.ratio} styles={styles} />
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
    </Stack>
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
      position: static;
    }
  `,
  modalHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    margin-left: ${theme.spacing(1)};
    margin-top: ${theme.spacing(2)};
  `,
  tabContent: css`
    background: transparent;
    padding-top: ${theme.spacing(2)};
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
