import React from 'react';
import { AlertLabel, type LabelMatcher } from '@grafana/alerting';
import { GrafanaTheme2 } from '@grafana/data';
import { Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface AlertLabelsDisplayProps {
  alertLabels: Record<string, string>;
  highlightMatchers: LabelMatcher[];
}

export const AlertLabelsDisplay: React.FC<AlertLabelsDisplayProps> = ({ alertLabels, highlightMatchers }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.section}>
      <Text variant="bodySmall" color="secondary" weight="regular">
        Notification policies determine which contact point receives this alert based on the labels below.
      </Text>
      <ul className={styles.labelsContainer} aria-label="Alert labels">
        {Object.entries(alertLabels).map(([key, value]) => {
          const isMatched = highlightMatchers.some(({ label }) => label === key);
          return (
            <li
              key={key}
              className={cx(styles.labelChip, {
                [styles.labelChipHighlighted]: isMatched,
                [styles.labelChipEmpty]: value === '',
              })}
              title={isMatched ? 'Used by a matching policy' : undefined}
            >
              <AlertLabel labelKey={key} value={value === '' ? 'Not set' : value} size="xs" />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: 0,
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
    fontWeight: theme.typography.fontWeightRegular,
    border: '1px solid transparent',
    borderRadius: theme.shape.radius.default,
    maxWidth: '100%',
    minWidth: 0,
    '& > div': { minWidth: 0, maxWidth: '100%' },
  }),

  labelChipHighlighted: css({
    borderColor: theme.colors.primary.border,
  }),

  labelChipEmpty: css({
    // AlertLabel has no value styling prop. Target only its value segment.
    '& > div > div > div:last-child': {
      color: theme.colors.warning.text,
      fontStyle: 'italic',
    },
  }),
});
