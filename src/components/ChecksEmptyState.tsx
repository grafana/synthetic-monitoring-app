import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { EmptyState, Icon, Text, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
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
                Or run our setup wizard in your project folder:
              </Text>
            </div>

            <div className={styles.cliPanelWrapper}>
              <Tooltip
                content={
                  <span className={styles.tooltipContent}>
                    This CLI is in public preview and may still change as we stabilize it
                  </span>
                }
              >
                <div className={styles.previewTab}>Preview</div>
              </Tooltip>

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
                      Requires Node.js 22.6+ · Uses Grafana Assistant tokens
                    </Text>
                  </div>

                  {isDetailsOpen && (
                    <div className={styles.footerDetails}>
                      <div className={styles.footerDetailsContent}>
                        <Text variant="bodySmall" color="secondary" element="p">
                          Our{' '}
                          <TextLink external href="https://github.com/grafana/cloud-setup" variant="bodySmall">
                            setup wizard
                          </TextLink>{' '}
                          is an open source CLI tool that does everything you need to get started and to
                          continue using Synthetic Monitoring in the future.
                        </Text>
                        <Text variant="bodySmall" color="secondary" element="p">
                          Incl. installing{' '}
                          <TextLink external href="https://github.com/grafana/gcx" variant="bodySmall">
                            gcx
                          </TextLink>
                          , analyzing your site, creating checks and exporting them as Terraform.
                        </Text>
                        <Text variant="bodySmall" color="secondary" element="p">
                          Needs{' '}
                          <TextLink external href="https://nodejs.org/en/download" variant="bodySmall">
                            Node.js 22.6+
                          </TextLink>{' '}
                          installed.
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
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

// Muted lavender, echoing the violet in the Grot illustration. Used at full
// strength for the package name, and at low opacity for the panel's border
// and hover tint, so the box has a bit of personality without being glossy.
const ACCENT_RGB = '184, 165, 227';

function getStyles(theme: GrafanaTheme2) {
  return {
    compactEmptyState: css({
      '& > div > div': {
        gap: theme.spacing(2),
        maxWidth: '760px',
        // EmptyState's title/subtitle are plain spans we can't pass a className
        // to directly (Text always overwrites it), so bump them a notch from here.
        '& > div > span:nth-of-type(1)': {
          fontSize: `calc(${theme.typography.h4.fontSize} * 1.1)`,
        },
        '& > div > span:nth-of-type(2)': {
          fontSize: `calc(${theme.typography.body.fontSize} * 1.1)`,
        },
      },
    }),
    cliPanelWrapper: css({
      position: 'relative',
    }),
    previewTab: css({
      position: 'absolute',
      bottom: '100%',
      left: theme.spacing(2),
      // Overlaps the panel's own top border by 1px, so the seam disappears and
      // this reads as a tab poking out of the card rather than a badge floating above it.
      marginBottom: '-1px',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      padding: theme.spacing(0.25, 1),
      // Smaller than the footer's own bodySmall (12px) text, so this reads as
      // a quiet release-status label rather than competing with it.
      fontSize: '11px',
      fontWeight: theme.typography.fontWeightRegular,
      lineHeight: theme.typography.bodySmall.lineHeight,
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.secondary,
      border: `1px solid ${theme.components.input.borderColor}`,
      borderTopLeftRadius: theme.shape.radius.default,
      borderTopRightRadius: theme.shape.radius.default,
    }),
    // The tooltip's own container has a hard 400px max-width with no prop to
    // override it, so this sentence needs a smaller font to fit on one line.
    // At 12px it measures ~385px against ~384px of usable width — right at
    // the edge, which is what was wrapping it.
    tooltipContent: css({
      display: 'inline-block',
      fontSize: '11px',
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
      // Neutral at rest — a permanent violet border made the whole box look
      // focused and gave this secondary path too much visual weight. The
      // violet shows up on the package name, the hover tint, and the
      // keyboard-focus ring instead.
      border: `1px solid ${theme.components.input.borderColor}`,
      borderRadius: theme.shape.radius.default,
      backgroundColor: theme.components.input.background,
      overflow: 'hidden',
    }),
    commandArea: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
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
      // A touch lighter than plain "primary" (canvas was too dark, secondary
      // too light), so the footer still reads as its own, quieter section.
      backgroundColor: theme.colors.emphasize(theme.colors.background.primary, 0.03),
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
      // Padding lives here rather than on commandArea, so this button — the
      // hover target — covers the whole top strip edge to edge, instead of a
      // rounded inset that looked like a selected input inside the box.
      padding: theme.spacing(2, 2.5),
      cursor: 'pointer',
      font: 'inherit',
      color: 'inherit',
      textAlign: 'left',
      transition: 'background-color 150ms ease',
      // Tints the whole row (with the same lavender as the border/package
      // name, for a bit of personality) and brightens the copy icon; the
      // command text and its layout stay untouched.
      '&:hover': {
        backgroundColor: `rgba(${ACCENT_RGB}, 0.1)`,
      },
      '&:hover svg': {
        color: theme.colors.text.primary,
      },
      // Violet ring for keyboard focus only — not on every mouse click —
      // so it reads as an accessibility affordance, not a permanent style.
      outline: 'none',
      '&:focus-visible': {
        outline: `2px solid rgba(${ACCENT_RGB}, 0.8)`,
        outlineOffset: '-2px',
      },
    }),
    copyIcon: css({
      flexShrink: 0,
      color: theme.colors.text.secondary,
      transition: 'color 150ms ease',
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
      // So the tool name reads as the one thing worth noticing in the
      // command. The rest of the command stays neutral on purpose.
      color: `rgb(${ACCENT_RGB})`,
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
