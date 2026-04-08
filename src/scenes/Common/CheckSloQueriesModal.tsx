import React, { useState } from 'react';
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
  Tab,
  TabContent,
  TabsBar,
  Text,
  TextLink,
  useStyles2,
} from '@grafana/ui';
import { css } from '@emotion/css';

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
  grafanaSloDetailDashboardHref,
  GRAFANA_SLO_CREATE,
  GRAFANA_SLO_HTTP_API_DOCS,
  SLO_OPENAPI_REPO,
  SM_UPTIME_DOCS,
} from './CheckSloQueriesModal.utils';

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
          This measures whether probes can reach the target, which differs from the in-app "uptime" metric. See{' '}
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
              <TextLink href={grafanaSloDetailDashboardHref(feedback.uuid, config.appSubUrl)} external>
                Open this SLO
              </TextLink>
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

        <TabsBar>
          {SLO_TABS.map((tab) => (
            <Tab
              key={tab}
              label={tab}
              active={activeTab === tab}
              onChangeTab={() => setActiveTab(tab)}
            />
          ))}
        </TabsBar>
        <TabContent className={styles.tabContent}>
          {activeTab === 'This check' && (
            <Stack direction="column" gap={2}>
              <Text color="secondary">
                One SLO for <strong>this</strong> check (job + instance). Uses the Grafana SLO API{' '}
                <code>ratio</code> type. For the UI flow or Explore, see{' '}
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
                    windowDays: sloWindowDays,
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
          )}

          {activeTab === 'Label group' && (
            <Stack direction="column" gap={2}>
              {check.labels.length > 0 ? (
                <>
                  <Text color="secondary">
                    One combined reachability SLI across every check whose <code>sm_check_info</code> matches the
                    labels you pick (<strong>AND</strong>). Uses the API <code>freeform</code> query type.
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
                            windowDays: sloWindowDays,
                          })
                        }
                      >
                        Create a SLO
                      </Button>

                      <SubCollapse title="PromQL for Explore or manual SLO editor">
                        <Stack direction="column" gap={1}>
                          <PromqlBlock label="Ratio (combined)" code={groupedQueries.ratio} styles={styles} />
                          <PromqlBlock label="Success (numerator)" code={groupedQueries.successQuery} styles={styles} />
                          <PromqlBlock
                            label="Total attempts (denominator)"
                            code={groupedQueries.totalQuery}
                            styles={styles}
                          />
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
          )}
        </TabContent>

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
