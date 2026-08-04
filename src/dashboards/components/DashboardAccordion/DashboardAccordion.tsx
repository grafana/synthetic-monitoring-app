import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { ControlledCollapse, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface DashboardAccordionProps {
  title: ReactNode;
  /** Sections start open — dashboard content should be visible by default. */
  defaultOpen?: boolean;
  className?: string;
}

export function DashboardAccordion({
  title,
  defaultOpen = true,
  className,
  children,
}: PropsWithChildren<DashboardAccordionProps>) {
  const styles = useStyles2(getStyles);

  return (
    <ControlledCollapse
      className={cx(styles.root, className)}
      label={<span className={styles.title}>{title}</span>}
      isOpen={defaultOpen}
    >
      <div className={styles.body}>{children}</div>
    </ControlledCollapse>
  );
}

const SPINE_WIDTH_PX = 3;
// Collapse header uses IconButton md: svg(16) + gridSize hover box.
const ICON_BUTTON_MD_SVG_PX = 16;

const getStyles = (theme: GrafanaTheme2) => {
  const iconButtonSizePx = ICON_BUTTON_MD_SVG_PX + theme.spacing.gridSize;
  // Center the spine under the Collapse chevron (header pad + half icon button).
  const spineOffset = `calc(${theme.spacing(1)} + ${iconButtonSizePx / 2}px - ${SPINE_WIDTH_PX / 2}px)`;

  return {
    root: css({
      background: 'none',
      border: 'none',
      borderRadius: 0,
      // Override Collapse flex growth so stacked sections don't fight for height.
      flex: '0 0 auto',
      // Drop Collapse body padding so the spine can line up with the header chevron.
      '& > div:last-child:not(:first-child)': {
        padding: 0,
      },
    }),
    title: css({
      fontSize: `calc(${theme.typography.h2.fontSize} * 1.5)`,
      fontWeight: theme.typography.fontWeightBold,
      lineHeight: theme.typography.h2.lineHeight,
    }),
    body: css({
      borderLeft: `${SPINE_WIDTH_PX}px solid ${theme.colors.border.medium}`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      marginLeft: spineOffset,
      minWidth: 0,
      paddingLeft: theme.spacing(2),
    }),
  };
};
