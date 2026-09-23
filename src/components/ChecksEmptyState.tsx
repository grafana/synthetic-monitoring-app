import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { EmptyState, Icon, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { FaroUserAction } from 'faro';
import { AddNewCheckButton } from 'components/AddNewCheckButton';

import { trackFaroUserAction } from '../features/tracking/userAction';

interface ChecksEmptyStatePageProps {
  className?: string;
}

const CLOUD_SETUP_PACKAGE = '@grafana/cloud-setup';

export function ChecksEmptyState({ className }: ChecksEmptyStatePageProps) {
  const styles = useStyles2(getStyles);
  const cliCommand = `npx ${CLOUD_SETUP_PACKAGE} synthetics --stack ${config.appUrl}`;
  const [beforePackage, afterPackage] = cliCommand.split(CLOUD_SETUP_PACKAGE);
  const [copied, setCopied] = useState(false);

  const handleCopyCommand = () => {
    if (!navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(cliCommand).then(() => {
      setCopied(true);
      trackFaroUserAction(FaroUserAction.CloudSetupCliCommandCopied);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={className} data-testid={CHECKS_TEST_ID.emptyState}>
      <div className={styles.compactEmptyState}>
        <EmptyState variant="call-to-action" message="You haven't created any checks yet" button={
          <div className={styles.cliSection}>
            <AddNewCheckButton source="check-list-empty-state">Create your first check</AddNewCheckButton>

            <div className={styles.panelIntro}>
              <Text variant="bodySmall" color="secondary" element="p">
                Or run our CLI-based setup wizard:
              </Text>
            </div>

            <div className={styles.cliPanel}>
              <div className={styles.commandArea}>
                <button
                  type="button"
                  className={styles.commandRow}
                  onClick={handleCopyCommand}
                  aria-label={copied ? 'Copied' : 'Copy command'}
                >
                  <div className={styles.commandLine}>
                    <span className={styles.prompt}>$</span>
                    <code className={styles.command}>
                      {beforePackage}
                      <span className={styles.packageName}>{CLOUD_SETUP_PACKAGE}</span>
                      {afterPackage}
                    </code>
                  </div>
                  <Icon className={styles.copyIcon} name={copied ? 'check' : 'clipboard-alt'} />
                </button>
              </div>
            </div>

            <Text variant="bodySmall" color="secondary">
              Requires Node.js 22.6+ and consumes Grafana Assistant tokens.
            </Text>
          </div>
        }>
          Get started monitoring your services with Grafana Cloud
        </EmptyState>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    compactEmptyState: css({
      '& > div > div': {
        gap: theme.spacing(2),
        maxWidth: '760px',
      },
    }),
    cliPanel: css({
      width: '100%',
      maxWidth: '720px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      textAlign: 'left',
      // Matches the top Search field's own colors, so this reads as a native, flat
      // surface rather than a glossy/elevated card.
      border: `1px solid ${theme.components.input.borderColor}`,
      borderRadius: theme.shape.radius.default,
      backgroundColor: theme.components.input.background,
      overflow: 'hidden',
    }),
    commandArea: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      padding: theme.spacing(2, 2.5),
    }),
    commandRow: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
      width: '100%',
      border: 'none',
      background: 'none',
      padding: 0,
      cursor: 'pointer',
      font: 'inherit',
      color: 'inherit',
      textAlign: 'left',
      '&:hover': {
        color: theme.colors.text.maxContrast,
      },
    }),
    copyIcon: css({
      flexShrink: 0,
      color: theme.colors.text.secondary,
    }),
    commandLine: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      minWidth: 0,
      overflowX: 'auto',
    }),
    prompt: css({
      flexShrink: 0,
      color: theme.colors.text.secondary,
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    command: css({
      whiteSpace: 'nowrap',
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
      background: 'none',
      border: 'none',
      padding: 0,
    }),
    packageName: css({
      // Muted lavender, echoing the violet in the Grot illustration, so the tool
      // name reads as the one thing worth noticing in the command. The rest of
      // the command stays neutral on purpose.
      color: '#B8A5E3',
    }),
    cliSection: css({
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
    }),
    panelIntro: css({
      // Some space between the button above and the CLI panel below.
      marginTop: theme.spacing(2),
    }),
  };
}
