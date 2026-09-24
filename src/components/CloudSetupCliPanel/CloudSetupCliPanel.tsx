import React, { useState } from 'react';
import { colorManipulator, GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, Text, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';

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
        className={styles.panel}
        // Width tracks the command's own length (monospace, so `ch` is exact) so nothing else can widen the panel.
        style={{ width: `calc(${cliCommand.length}ch + 4.5rem)` }}
      >
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
          <span className={styles.iconWrap}>
            <Icon
              className={cx(styles.copyIcon, copied && styles.copyIconPop)}
              name={copied ? 'check' : 'clipboard-alt'}
            />
            {copied && (
              <span className={styles.particles}>
                {PARTICLE_OFFSETS.map(([tx, ty], i) => (
                  <span
                    key={i}
                    className={styles.particle}
                    style={{ '--tx': `${tx}px`, '--ty': `${ty}px` } as React.CSSProperties}
                  />
                ))}
              </span>
            )}
          </span>
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
                  <TextLink external href="https://github.com/grafana/cloud-setup" variant="bodySmall">
                    The setup wizard
                  </TextLink>{' '}
                  installs{' '}
                  <TextLink external href="https://grafana.com/docs/grafana-cloud/ai-tools/gcx/" variant="bodySmall">
                    gcx
                  </TextLink>{' '}
                  and{' '}
                  <TextLink
                    external
                    href="https://grafana.com/docs/grafana-cloud/machine-learning/assistant/platform/skills/"
                    variant="bodySmall"
                  >
                    Agent Skills
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

// Shared by the preview tab and the tooltip, both meant to stay quiet.
const QUIET_FONT_SIZE = '11px';

// A quick, self-contained pop for the checkmark when it swaps in.
const iconPop = keyframes({
  '0%': { transform: 'scale(0.5)' },
  '60%': { transform: 'scale(1.25)' },
  '100%': { transform: 'scale(1)' },
});

// Six points around a circle, radius 16px, for the particle burst.
const PARTICLE_COUNT = 6;
const PARTICLE_RADIUS = 16;
const PARTICLE_OFFSETS: Array<[number, number]> = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
  return [PARTICLE_RADIUS * Math.cos(angle), PARTICLE_RADIUS * Math.sin(angle)] as [number, number];
});

// Small dots fly outward from the icon and fade, like a tiny confetti pop.
// translate(-50%, -50%) is the centering offset; the animated part is added on top of it.
const particleBurst = keyframes({
  '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
  '100%': { transform: 'translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.3)', opacity: 0 },
});

function getStyles(theme: GrafanaTheme2) {
  const borderColor = theme.components.input.borderColor;
  // Theme-aware accent (tracks light/dark/high-contrast) instead of a fixed lavender.
  const accentColor = theme.visualization.getColorByName('purple');

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
      // Smaller than the footer's 12px text on purpose, so it stays quiet.
      fontSize: QUIET_FONT_SIZE,
      fontWeight: theme.typography.fontWeightRegular,
      lineHeight: theme.typography.bodySmall.lineHeight,
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.secondary,
      border: `1px solid ${borderColor}`,
      borderRadius: `${theme.shape.radius.default} ${theme.shape.radius.default} 0 0`,
    }),
    // Shrunk to fit on one line — Tooltip's container has a fixed 400px max-width with no override prop.
    tooltipContent: css({
      display: 'inline-block',
      fontSize: QUIET_FONT_SIZE,
    }),

    // --- panel: the command + footer card itself ---
    panel: css({
      // Viewport safety cap — the real width is set inline, above.
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
    iconWrap: css({
      position: 'relative',
      display: 'inline-flex',
      flexShrink: 0,
    }),
    copyIcon: css({
      color: theme.colors.text.secondary,
      transition: 'color 150ms ease',
    }),
    copyIconPop: css({
      animation: `${iconPop} 300ms ease-out`,
    }),
    particles: css({
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
    }),
    particle: css({
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '4px',
      height: '4px',
      borderRadius: '50%',
      backgroundColor: accentColor,
      animation: `${particleBurst} 550ms ease-out forwards`,
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
      // minWidth lets long text wrap here instead of forcing the panel wider.
      flexBasis: '100%',
      minWidth: 0,
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
