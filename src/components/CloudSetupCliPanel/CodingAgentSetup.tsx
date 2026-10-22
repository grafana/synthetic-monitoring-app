import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { ClipboardButton, CollapsableSection, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackCloudSetupAgentPromptCopied, trackCloudSetupAgentPromptShown } from 'features/tracking/cloudSetupEvents';
import { trackFaroUserAction } from 'features/tracking/userAction';

import { FaroEvent, FaroUserAction, reportError } from 'faro';

import { getCodingAgentPrompt } from './codingAgentPrompt';

export function CodingAgentSetup() {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const prompt = getCodingAgentPrompt(config.appUrl.replace(/\/$/, ''));

  return (
    <div className={styles.section}>
      <CollapsableSection
        className={styles.header}
        contentClassName={styles.content}
        label={
          <Text variant="bodySmall" color="secondary" weight="regular">
            <Trans i18nKey="codingAgentSetup.title">Or use a coding agent</Trans>
          </Text>
        }
        isOpen={isOpen}
        onToggle={(open) => {
          if (open) {
            trackCloudSetupAgentPromptShown();
          }
          setIsOpen(open);
        }}
      >
        <div className={styles.promptBox}>
          <div className={styles.toolbar}>
            <Text color="secondary" variant="bodySmall">
              <Trans i18nKey="codingAgentSetup.description">Use this prompt to create checks for your project.</Trans>
            </Text>
            <ClipboardButton
              aria-label={t('codingAgentSetup.copy', 'Copy prompt')}
              getText={() => prompt}
              icon="clipboard-alt"
              size="sm"
              fill="text"
              variant="secondary"
              onClipboardCopy={() => {
                setCopyFailed(false);
                trackFaroUserAction(FaroUserAction.CloudSetupAgentPromptCopied);
                trackCloudSetupAgentPromptCopied();
              }}
              onClipboardError={(_, error) => {
                setCopyFailed(true);
                reportError(String(error), FaroEvent.CloudSetupAgentPromptCopyFailed);
              }}
            >
              <Trans i18nKey="cloudSetupCliPanel.copy">Copy</Trans>
            </ClipboardButton>
          </div>
          {copyFailed && (
            <div role="alert" className={styles.error}>
              <Text color="error" variant="bodySmall">
                <Trans i18nKey="codingAgentSetup.copyFailed">Could not copy. Select and copy the prompt below.</Trans>
              </Text>
            </div>
          )}
          <pre
            className={styles.prompt}
            role="region"
            aria-label={t('codingAgentSetup.promptLabel', 'Coding agent prompt')}
          >
            {prompt}
          </pre>
        </div>
      </CollapsableSection>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    section: css({
      width: '100%',
      textAlign: 'left',
    }),
    header: css({
      width: 'fit-content',
      marginInline: 'auto',
      justifyContent: 'center',
      padding: theme.spacing(0.5),
      '& > button': { display: 'inline-flex', alignItems: 'center' },
      '& > div': { flex: '0 1 auto' },
    }),
    content: css({
      padding: `${theme.spacing(2)} 0 0`,
    }),
    promptBox: css({
      background: theme.components.input.background,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
    }),
    toolbar: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.5),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    }),
    error: css({
      padding: `${theme.spacing(1)} ${theme.spacing(1.5)} 0`,
    }),
    prompt: css({
      margin: 0,
      padding: theme.spacing(1.5),
      border: 'none',
      background: 'none',
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: theme.typography.bodySmall.lineHeight,
      whiteSpace: 'pre-wrap',
      wordBreak: 'normal',
      overflowWrap: 'anywhere',
      userSelect: 'text',
      cursor: 'text',
    }),
  };
}
