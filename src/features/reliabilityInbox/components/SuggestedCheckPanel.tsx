import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Button, ClipboardButton, Icon, IconName, Stack, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { HttpMethod } from 'types';
import { formatDuration, getMethodColor } from 'utils';

import { ReliabilityOpportunity } from '../model';
import { ProposedHttpCheckDraft } from '../proposedCheck';
import { RecommendationEvidence } from './RecommendationEvidence';

const CONTAINER_NAME = 'suggestedCheck';
const CREATION_ENCOURAGEMENT = [
  'Turn this traffic signal into proactive coverage.',
  'Start monitoring this endpoint in under a minute.',
  'Catch outages before your users do.',
] as const;

interface SuggestedCheckPanelProps {
  opportunity: ReliabilityOpportunity;
  assistantDisabled: boolean;
  assistantTooltip?: string;
  dismissed: boolean;
  onCreateManually: () => void;
  onDismiss: () => void;
  onRestore: () => void;
  onSetUpWithAssistant: () => void;
}

export function SuggestedCheckPanel({
  opportunity,
  assistantDisabled,
  assistantTooltip,
  dismissed,
  onCreateManually,
  onDismiss,
  onRestore,
  onSetUpWithAssistant,
}: SuggestedCheckPanelProps) {
  const { proposedCheck } = opportunity;
  const styles = useStyles2(getStyles);
  const [creationEncouragement] = useState(selectCreationEncouragement);

  return (
    <section aria-label="Suggested HTTP check">
      <div className={styles.card}>
        <RecommendationEvidence
          opportunity={opportunity}
          headerContent={
            <Stack direction="row" alignItems="center" gap={2} wrap="wrap">
              <Text element="h2" variant="h3" color="info" weight="medium">
                Suggested check
              </Text>
              <Badge color="darkgrey" icon="globe" text="HTTP" />
              {dismissed && <Badge color="darkgrey" text="Dismissed" />}
              {!dismissed && (
                <div className={styles.creationEncouragement}>
                  <Icon name="shield" size="sm" />
                  <Text variant="bodySmall" color="primary">
                    {creationEncouragement}
                  </Text>
                </div>
              )}
            </Stack>
          }
        />

        <ConfigurationSection>
          <CheckIdentity proposedCheck={proposedCheck} />
        </ConfigurationSection>

        <ConfigurationSection titleId="reliability-inbox-uptime-heading">
          <ConfigurationTitle title="Uptime definition" id="reliability-inbox-uptime-heading" />
          <OptionGrid columns={3}>
            <CheckField icon="hourglass" label="Timeout">
              {formatDuration(proposedCheck.timeoutMs)}
            </CheckField>
            <CheckField icon="check-circle" label="Expected response">
              HTTP {proposedCheck.validStatusCodes.join(', ')}
            </CheckField>
            <CheckField icon="shield" label="TLS requirement">
              {proposedCheck.failIfNotSSL ? 'Require HTTPS' : 'Not required'}
            </CheckField>
          </OptionGrid>
        </ConfigurationSection>

        <ConfigurationSection titleId="reliability-inbox-configuration-heading">
          <ConfigurationTitle title="Configuration" id="reliability-inbox-configuration-heading" />
          <OptionGrid columns={4}>
            <CheckField icon="clock-nine" label="Frequency">
              Every {formatDuration(proposedCheck.frequencyMs)}
            </CheckField>
            <CheckField icon="map-marker" label="Locations">
              {proposedCheck.locationPolicy}
            </CheckField>
            <CheckField icon="tag-alt" label="Labels">
              Added during creation
            </CheckField>
            <CheckField icon="bell" label="Alerts">
              Configured during creation
            </CheckField>
          </OptionGrid>
        </ConfigurationSection>
        <SuggestedCheckActions
          assistantDisabled={assistantDisabled}
          assistantTooltip={assistantTooltip}
          dismissed={dismissed}
          onCreateManually={onCreateManually}
          onDismiss={onDismiss}
          onRestore={onRestore}
          onSetUpWithAssistant={onSetUpWithAssistant}
        />
      </div>
    </section>
  );
}

function selectCreationEncouragement() {
  return CREATION_ENCOURAGEMENT[Math.floor(Math.random() * CREATION_ENCOURAGEMENT.length)];
}

function ConfigurationSection({ children, titleId }: { children: React.ReactNode; titleId?: string }) {
  const styles = useStyles2(getConfigurationSectionStyles);
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      {children}
    </section>
  );
}

const ConfigurationTitle = ({ title, id }: { title: string; id?: string }) => {
  return (
    <Text element="h3" variant="h4" id={id} weight="medium">
      {title}
    </Text>
  );
};

function CheckIdentity({ proposedCheck }: { proposedCheck: ProposedHttpCheckDraft }) {
  return (
    <div>
      <CheckField icon="tag-alt" label="Job name" layout="row">
        {proposedCheck.job}
      </CheckField>
      <CheckField icon="link" label="Target URL" layout="row">
        <TargetUrl method={proposedCheck.method} target={proposedCheck.target} />
      </CheckField>
    </div>
  );
}

function CheckField({
  children,
  icon,
  label,
  layout = 'stack',
  valueClassName,
}: {
  children: React.ReactNode;
  icon: IconName;
  label: string;
  layout?: 'row' | 'stack';
  valueClassName?: string;
}) {
  const styles = useStyles2(getCheckFieldStyles);

  return (
    <div className={layout === 'row' ? styles.row : styles.field}>
      <div className={styles.label}>
        <Icon name={icon} size="sm" />
        {label}
      </div>
      <div className={cx(styles.value, layout === 'stack' && styles.stackedValue, valueClassName)}>{children}</div>
    </div>
  );
}

function TargetUrl({ method, target }: { method: string; target: string }) {
  const styles = useStyles2(getTargetUrlStyles, method as HttpMethod);

  return (
    <div className={styles.value}>
      <span className={styles.method}>{method}</span>
      <code>{target}</code>
      <ClipboardButton
        aria-label="Copy target URL"
        fill="text"
        getText={() => target}
        icon="clipboard-alt"
        size="sm"
        variant="secondary"
      >
        Copy
      </ClipboardButton>
    </div>
  );
}

function OptionGrid({ children, columns }: { children: React.ReactNode; columns: 2 | 3 | 4 }) {
  const styles = useStyles2(getOptionGridStyles);

  return (
    <div className={cx(styles.grid, columns === 4 ? styles.four : columns === 3 ? styles.three : styles.two)}>
      {children}
    </div>
  );
}

function SuggestedCheckActions({
  assistantDisabled,
  assistantTooltip,
  dismissed,
  onCreateManually,
  onDismiss,
  onRestore,
  onSetUpWithAssistant,
}: {
  assistantDisabled: boolean;
  assistantTooltip?: string;
  dismissed: boolean;
  onCreateManually: () => void;
  onDismiss: () => void;
  onRestore: () => void;
  onSetUpWithAssistant: () => void;
}) {
  const styles = useStyles2(getSuggestedCheckActionsStyles);

  if (dismissed) {
    return (
      <footer className={styles.footer}>
        <Text variant="bodySmall" color="secondary">
          This suggestion was dismissed in this browser.
        </Text>
        <Button className={styles.restoreAction} variant="primary" onClick={onRestore}>
          Restore suggestion
        </Button>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.leftContent}>
        <div className={styles.createActions}>
          <Button variant="secondary" onClick={onCreateManually}>
            Create manually
          </Button>
          <Button
            aria-describedby="reliability-inbox-assistant-action-help"
            className={styles.assistantAction}
            icon="ai-sparkle"
            disabled={assistantDisabled}
            tooltip={assistantTooltip}
            variant="secondary"
            onClick={onSetUpWithAssistant}
          >
            Create with Grafana Assistant
          </Button>
        </div>
        <div className={styles.guidance}>
          <Text id="reliability-inbox-assistant-action-help" variant="bodySmall" color="secondary">
            You can review and adjust every setting in the check editor before anything is created.
          </Text>
        </div>
      </div>
      <Button className={styles.dismissAction} variant="secondary" fill="text" onClick={onDismiss}>
        Dismiss suggestion
      </Button>
    </footer>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    card: css({
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.medium}`,
      borderLeft: `3px solid ${theme.colors.info.text}`,
      borderRadius: theme.shape.radius.default,
      containerName: CONTAINER_NAME,
      containerType: 'inline-size',
      marginInline: 'auto',
      maxWidth: theme.breakpoints.values.xxl,
      overflow: 'hidden',
      width: '100%',
    }),
    creationEncouragement: css({
      alignItems: 'center',
      color: theme.colors.info.text,
      display: 'flex',
      gap: theme.spacing(0.75),
      marginLeft: 'auto',
      textAlign: 'right',
    }),
  };
}

function getConfigurationSectionStyles(theme: GrafanaTheme2) {
  return {
    section: css({
      padding: theme.spacing(2, 2.5),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      '& + &': {
        borderTop: `1px solid ${theme.colors.border.medium}`,
      },
    }),
  };
}

function getCheckFieldStyles(theme: GrafanaTheme2) {
  const atMd = `@container ${CONTAINER_NAME} (min-width: ${theme.breakpoints.values.md}px)`;

  return {
    field: css({
      minWidth: 0,
    }),
    row: css({
      alignItems: 'stretch',
      display: 'grid',
      gap: theme.spacing(0.5),
      gridTemplateColumns: '1fr',
      padding: theme.spacing(1.25, 0),
      [atMd]: {
        alignItems: 'baseline',
        gap: theme.spacing(2),
        gridTemplateColumns: 'minmax(120px, max-content) minmax(0, 1fr)',
      },
    }),
    label: css({
      alignItems: 'center',
      color: theme.colors.text.secondary,
      display: 'flex',
      fontSize: theme.typography.bodySmall.fontSize,
      gap: theme.spacing(0.75),
    }),
    value: css({
      minWidth: 0,
      overflowWrap: 'anywhere',
    }),
    stackedValue: css({
      margin: theme.spacing(0.75, 0, 0),
    }),
  };
}

function getTargetUrlStyles(theme: GrafanaTheme2, method: HttpMethod) {
  return {
    value: css({
      alignItems: 'center',
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1.5),
      minWidth: 0,
      '& code': {
        flex: 1,
        fontFamily: theme.typography.fontFamilyMonospace,
        minWidth: 0,
        overflowWrap: 'anywhere',
      },
    }),
    method: css({
      color: getMethodColor(theme, method),
      flex: '0 0 auto',
      fontWeight: theme.typography.fontWeightMedium,
    }),
  };
}

function getOptionGridStyles(theme: GrafanaTheme2) {
  const atSm = `@container ${CONTAINER_NAME} (min-width: ${theme.breakpoints.values.sm}px)`;
  const atMd = `@container ${CONTAINER_NAME} (min-width: ${theme.breakpoints.values.md}px)`;
  const atLg = `@container ${CONTAINER_NAME} (min-width: ${theme.breakpoints.values.lg}px)`;

  return {
    grid: css({
      display: 'grid',
      gap: theme.spacing(1.25),
      marginTop: theme.spacing(1.5),
      [atMd]: {
        gap: theme.spacing(2),
      },
    }),
    two: css({
      gridTemplateColumns: '1fr',
      [atMd]: {
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      },
    }),
    three: css({
      gridTemplateColumns: '1fr',
      [atSm]: {
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      },
    }),
    four: css({
      gridTemplateColumns: '1fr',
      [atSm]: {
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      },
      [atLg]: {
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      },
    }),
  };
}

function getSuggestedCheckActionsStyles(theme: GrafanaTheme2) {
  const atSm = `@container ${CONTAINER_NAME} (min-width: ${theme.breakpoints.values.sm}px)`;
  const atMd = `@container ${CONTAINER_NAME} (min-width: ${theme.breakpoints.values.md}px)`;

  return {
    assistantAction: getAssistantActionStyle(theme),
    footer: css({
      alignItems: 'stretch',
      background: theme.colors.background.secondary,
      borderTop: `1px solid ${theme.colors.border.medium}`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      padding: theme.spacing(2, 2.5),
      [atMd]: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
    }),
    leftContent: css({
      alignItems: 'stretch',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      minWidth: 0,
    }),
    createActions: css({
      alignItems: 'stretch',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      [atSm]: {
        alignItems: 'center',
        flexDirection: 'row',
      },
    }),
    guidance: css({
      textAlign: 'left',
    }),
    restoreAction: css({
      alignSelf: 'flex-start',
      flex: '0 0 auto',
    }),
    dismissAction: css({
      alignSelf: 'flex-end',
      flex: '0 0 auto',
    }),
  };
}

function getAssistantActionStyle(theme: GrafanaTheme2) {
  const baseBackground = theme.colors.secondary.main;
  const elevatedBackground = theme.colors.emphasize(baseBackground, 0.05);
  const underlyingColor = theme.colors.background.canvas;
  const outerRadius = theme.shape.radius.default;

  return css({
    label: 'reliability-inbox-assistant-action',
    width: 'fit-content',
    maxWidth: '100%',
    position: 'relative',
    isolation: 'isolate',
    border: 'none',
    background: 'none',
    color: theme.colors.text.primary,
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: outerRadius,
      background: 'linear-gradient(90deg, rgb(168, 85, 247), rgb(249, 115, 22))',
      zIndex: -2,
      pointerEvents: 'none',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 1,
      borderRadius: `calc(${outerRadius} - 1px)`,
      background: `linear-gradient(${baseBackground}, ${baseBackground}), ${underlyingColor}`,
      zIndex: -1,
      pointerEvents: 'none',
    },
    '&:hover::after': {
      background: `linear-gradient(${elevatedBackground}, ${elevatedBackground}), ${underlyingColor}`,
    },
    '& > span': {
      color: `${theme.colors.text.primary} !important`,
    },
  });
}
