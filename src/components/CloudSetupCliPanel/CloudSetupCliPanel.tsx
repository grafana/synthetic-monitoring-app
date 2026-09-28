import React, { useState } from 'react';
import { colorManipulator, GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, Text, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FaroEvent, FaroUserAction, reportError } from '../../faro';
import { trackFaroUserAction } from '../../features/tracking/userAction';
import { useCopyToClipboard } from '../Clipboard/useCopyToClipboard';

const CLOUD_SETUP_PACKAGE = '@grafana/cloud-setup';

export function CloudSetupCliPanel() {
  const styles = useStyles2(getStyles);
  const stackUrl = config.appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cliCommand = `npx ${CLOUD_SETUP_PACKAGE} synthetics --stack ${stackUrl}`;
  const [beforePackage, afterPackage] = cliCommand.split(CLOUD_SETUP_PACKAGE);
  const { copied, copy } = useCopyToClipboard({
    onCopy: () => trackFaroUserAction(FaroUserAction.CloudSetupCliCommandCopied),
    onError: (err) => reportError(String(err), FaroEvent.CloudSetupCliCommandCopyFailed),
    resetAfterMs: 1500,
  });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <Tooltip content="This CLI is in public preview and may still change as we stabilize it">
        <div className={styles.previewTab}>Preview</div>
      </Tooltip>

      <div className={styles.panel}>
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
                  The setup wizard installs{' '}
                  <TextLink external href="https://grafana.com/docs/grafana-cloud/ai-tools/gcx/" variant="bodySmall">
                    gcx
                  </TextLink>{' '}
                  and{' '}
                  <TextLink
                    external
                    href="https://grafana.com/docs/grafana-cloud/machine-learning/assistant/platform/skills/"
                    variant="bodySmall"
                  >
                    agent skills
                  </TextLink>
                  , then analyzes your site and suggests synthetic checks for you to review and
                  create. You can also configure alerts and export checks as Terraform.
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  const borderColor = theme.components.input.borderColor;
  // Derived from the theme's own semantic purple, not a custom hex. The dark-mode
  // value is lightened to soften it (getColorByName('purple') alone read too
  // saturated); light mode uses it as-is since it's already calibrated for
  // contrast against a white background (~4.5:1) and lightening would hurt that.
  const themePurple = theme.visualization.getColorByName('purple');
  const accentColor = theme.isDark ? colorManipulator.lighten(themePurple, 0.35) : themePurple;

  return {
    // --- wrapper: the panel plus its overlapping "Preview" tab ---
    wrapper: css({
      position: 'relative',
    }),
    previewTab: css({
      position: 'absolute',
      bottom: '100%',
      left: theme.spacing(2),
      // Overlaps the panel's border by 1px so it reads as a tab, not a floating badge.
      marginBottom: '-1px',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      padding: theme.spacing(0.25, 1),
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightRegular,
      lineHeight: theme.typography.bodySmall.lineHeight,
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.secondary,
      border: `1px solid ${borderColor}`,
      borderRadius: `${theme.shape.radius.default} ${theme.shape.radius.default} 0 0`,
    }),

    // --- panel: the command + footer card itself ---
    panel: css({
      // Shrinks to the command's width, capped so it doesn't overflow the
      // viewport — the command itself scrolls if it's ever longer than that.
      width: 'fit-content',
      maxWidth: 'min(720px, 100%)',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      textAlign: 'left',
      // Neutral at rest — violet shows up on hover, focus, and the package name instead.
      border: `1px solid ${borderColor}`,
      borderRadius: theme.shape.radius.default,
      backgroundColor: theme.components.input.background,
      overflow: 'hidden',
    }),

    // --- the copyable command row ---
    commandRow: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
      width: '100%',
      border: 'none',
      background: 'none',
      padding: theme.spacing(2, 2.5),
      cursor: 'pointer',
      font: 'inherit',
      color: 'inherit',
      textAlign: 'left',
      transition: 'background-color 150ms ease',
      '&:hover': {
        backgroundColor: colorManipulator.alpha(accentColor, 0.1),
      },
      '&:hover svg': {
        color: theme.colors.text.primary,
      },
      // Keyboard-only focus ring — not shown on mouse clicks.
      outline: 'none',
      '&:focus-visible': {
        outline: `2px solid ${colorManipulator.alpha(accentColor, 0.8)}`,
        outlineOffset: '-2px',
      },
    }),
    commandLine: css({
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
      // The one accent color in the command, so the tool name stands out.
      color: accentColor,
    }),
    copyIcon: css({
      flexShrink: 0,
      color: theme.colors.text.secondary,
      transition: 'color 150ms ease',
    }),

    // --- footer: "What does it do?" trigger, note, and expanded details ---
    footer: css({
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(0.5, 2),
      // Padding lives on the children so footerDetails's border can span the full width.
      padding: theme.spacing(1, 0),
      borderTop: `1px solid ${borderColor}`,
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
      // minWidth lets long text wrap here instead of forcing the panel wider. Since
      // panel's own width is fit-content, minWidth alone isn't enough — this text's
      // full unwrapped length would still count toward that calculation without
      // inline-size containment isolating it (verified: without this, the panel
      // visibly jumps wider the instant this expands).
      flexBasis: '100%',
      minWidth: 0,
      contain: 'inline-size',
      marginTop: theme.spacing(1),
      paddingTop: theme.spacing(1),
      borderTop: `1px solid ${borderColor}`,
    }),
    footerDetailsContent: css({
      paddingLeft: theme.spacing(2.5),
      paddingRight: theme.spacing(2.5),
    }),
  };
}
