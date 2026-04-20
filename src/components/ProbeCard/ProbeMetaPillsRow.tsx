import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

/**
 * Metadata chips matching {@link CheckListItemDetails} `layout="wrap"` pill styling
 * (background.primary, 2px radius) so probe cards align visually with check list cards.
 */
type ProbeMetaPillsRowProps = {
  version: string;
  /** When set, renders a second pill `k6 {k6Pill}` (e.g. from `formatK6VersionsInline`). */
  k6Pill?: string;
  trailing?: React.ReactNode;
  className?: string;
};

export function ProbeMetaPillsRow({ version, k6Pill, trailing, className }: ProbeMetaPillsRowProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.row, className)}>
      <span className={styles.pill}>Version {version}</span>
      {k6Pill !== undefined && k6Pill !== '' && <span className={styles.pill}>k6 {k6Pill}</span>}
      {trailing}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  row: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.bodySmall.lineHeight,
    minWidth: 0,
  }),
  pill: css({
    backgroundColor: theme.colors.background.primary,
    borderRadius: '2px',
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    fontVariantNumeric: 'tabular-nums',
  }),
});
