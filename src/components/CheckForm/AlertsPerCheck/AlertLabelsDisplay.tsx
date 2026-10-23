import React, { useId, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface AlertLabelsDisplayProps {
  alertLabels: Record<string, string>;
}

export const AlertLabelsDisplay: React.FC<AlertLabelsDisplayProps> = ({ alertLabels }) => {
  const styles = useStyles2(getStyles);
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const labels = Object.entries(alertLabels);

  return (
    <div className={styles.section}>
      <p className={styles.description}>
        Notification policies determine which contact points receive this alert based on its labels.{' '}
        <Button
          type="button"
          variant="secondary"
          fill="text"
          size="sm"
          className={styles.toggle}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide labels' : 'See labels'}
          <Icon name={expanded ? 'angle-up' : 'angle-down'} size="sm" />
        </Button>
      </p>
      {expanded && (
        <div id={detailsId}>
          <LabelList labels={labels} name="Alert labels" />
        </div>
      )}
    </div>
  );
};

const LabelList = ({ labels, name }: { labels: Array<[string, string]>; name: string }) => {
  const styles = useStyles2(getStyles);

  return (
    <ul className={styles.labelsContainer} aria-label={name}>
      {labels.map(([key, value]) => {
        const isEmpty = value === '';
        const displayValue = isEmpty ? 'Not set' : value;
        return (
          <li key={key} className={cx(styles.labelChip, { [styles.labelChipEmpty]: isEmpty })}>
            {isEmpty && <Icon name="exclamation-triangle" size="sm" className={styles.warningIcon} />}
            <span
              className={styles.labelContent}
              aria-label={`${key}: ${displayValue}`}
              title={`${key} = ${displayValue}`}
            >
              {key} = <span className={isEmpty ? styles.emptyValue : undefined}>{displayValue}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: 0,
  }),

  description: css({
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeightRegular,
    margin: 0,
  }),

  toggle: css({
    color: theme.colors.text.link,
    fontWeight: theme.typography.fontWeightRegular,
    padding: theme.spacing(0, 0.5),
    height: 'auto',
    minHeight: theme.spacing(3),
    lineHeight: theme.typography.bodySmall.lineHeight,
    verticalAlign: 'baseline',
  }),

  labelsContainer: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75, 1),
    listStyle: 'none',
    padding: 0,
    margin: 0,
  }),

  labelChip: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.33, 0.66),
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightRegular,
    lineHeight: theme.typography.bodySmall.lineHeight,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.pill,
    maxWidth: '100%',
    minWidth: 0,
  }),

  labelChipEmpty: css({
    borderColor: theme.colors.warning.border,
  }),

  labelContent: css({
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre',
  }),

  emptyValue: css({
    color: theme.colors.warning.text,
  }),

  warningIcon: css({
    flexShrink: 0,
    color: theme.colors.warning.text,
  }),
});
