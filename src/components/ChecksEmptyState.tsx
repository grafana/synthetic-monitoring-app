import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { EmptyState, Icon, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { FaroUserAction } from 'faro';
import { AddNewCheckButton } from 'components/AddNewCheckButton';
import { useCopyToClipboard } from 'components/Clipboard/useCopyToClipboard';

import { trackFaroUserAction } from '../features/tracking/userAction';

interface ChecksEmptyStatePageProps {
  className?: string;
}

const CLOUD_SETUP_PACKAGE = '@grafana/cloud-setup';

export function ChecksEmptyState({ className }: ChecksEmptyStatePageProps) {
  const styles = useStyles2(getStyles);
  const stackUrl = config.appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cliCommand = `npx ${CLOUD_SETUP_PACKAGE} synthetics --stack ${stackUrl}`;
  const [beforePackage, afterPackage] = cliCommand.split(CLOUD_SETUP_PACKAGE);
  const { copied, copy } = useCopyToClipboard({
    onCopy: () => trackFaroUserAction(FaroUserAction.CloudSetupCliCommandCopied),
    resetAfterMs: 1500,
  });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className={className} data-testid={CHECKS_TEST_ID.emptyState}>
      <div className={styles.compactEmptyState}>
        <EmptyState variant="call-to-action" message="You haven't created any checks yet" button={
          <div className={styles.cliSection}>
            <AddNewCheckButton source="check-list-empty-state">Create your first check</AddNewCheckButton>

            <div className={styles.panelIntro}>
              <Text variant="bodySmall" color="secondary" element="p">
                Or run our setup wizard:
              </Text>
            </div>

            <div
              className={styles.cliPanel}
              // Sized off the command's own character count (it's monospace, so
              // `ch` is exact), plus a fixed allowance for the panel's padding,
              // the gap, and the copy icon. Nothing else inside — including the
              // "what does it do" explanation — can influence this width; it can
              // only wrap within it.
              style={{ width: `calc(${cliCommand.length}ch + 4.5rem)` }}
            >
              <div className={styles.commandArea}>
                <button
                  type="button"
                  className={styles.commandRow}
                  onClick={() => copy(cliCommand)}
                  aria-label={copied ? 'Copied' : 'Copy command'}
                >
                  <div className={styles.commandLine}>
                    <code className={styles.command}>
                      {beforePackage}
                      <span className={styles.packageName}>{CLOUD_SETUP_PACKAGE}</span>
                      {afterPackage}
                    </code>
                  </div>
                  <Icon className={styles.copyIcon} name={copied ? 'check' : 'clipboard-alt'} />
                </button>
              </div>

              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.footerTrigger}
                  onClick={() => setIsDetailsOpen((v) => !v)}
                  aria-expanded={isDetailsOpen}
                >
                  <Icon name={isDetailsOpen ? 'angle-down' : 'angle-right'} />
                  <span>What does it do?</span>
                </button>

                <div className={styles.footerNote}>
                  <Text variant="bodySmall" color="secondary">
                    Requires Node.js 22.6+ and consumes Grafana Assistant tokens
                  </Text>
                </div>

                {isDetailsOpen && (
                  <div className={styles.footerDetails}>
                    <div className={styles.footerDetailsContent}>
                      <Text variant="bodySmall" color="secondary" element="p">
                        It does everything you need to get started and to continue using Synthetic
                        Monitoring in the future.
                      </Text>
                      <Text variant="bodySmall" color="secondary" element="p">
                        Incl. installing{' '}
                        <TextLink external href="https://github.com/grafana/gcx" variant="bodySmall">
                          gcx
                        </TextLink>
                        , analyzing your site, creating checks and exporting them as Terraform.
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
      // Width itself is set inline, driven by the command's character count.
      // This just keeps it from overflowing a narrow viewport.
      maxWidth: 'min(720px, 100%)',
      boxSizing: 'border-box',
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
    footer: css({
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(0.5, 2),
      // Horizontal padding lives on the individual children instead of here, so
      // footerDetails's own border below can span the panel's full width without
      // fighting this container's padding.
      padding: theme.spacing(1, 0),
      borderTop: `1px solid ${theme.components.input.borderColor}`,
      // Distinct from the command row's background, so the footer reads as its
      // own section rather than a continuation of the same surface.
      backgroundColor: theme.colors.background.secondary,
    }),
    footerTrigger: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      border: 'none',
      background: 'none',
      padding: 0,
      paddingLeft: theme.spacing(2.5),
      cursor: 'pointer',
      font: 'inherit',
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
      '&:hover': {
        color: theme.colors.text.maxContrast,
      },
    }),
    footerNote: css({
      color: theme.colors.text.secondary,
      paddingRight: theme.spacing(2.5),
    }),
    footerDetails: css({
      // Forces this onto its own row, spanning the footer's full width, in the
      // wrapping flex container above. minWidth lets the text wrap within that
      // row instead of forcing the panel wider. No horizontal padding here, so
      // the top border reaches the panel's actual edges; footerDetailsContent
      // carries the inset for the text/list instead.
      flexBasis: '100%',
      minWidth: 0,
      marginTop: theme.spacing(1),
      paddingTop: theme.spacing(1),
      borderTop: `1px solid ${theme.components.input.borderColor}`,
    }),
    footerDetailsContent: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      paddingLeft: theme.spacing(2.5),
      paddingRight: theme.spacing(2.5),
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
    command: css({
      whiteSpace: 'nowrap',
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.body.fontSize,
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
