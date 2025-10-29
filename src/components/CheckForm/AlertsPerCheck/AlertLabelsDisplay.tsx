import React from 'react';
import { type LabelMatcher } from '@grafana/alerting';
import { GrafanaTheme2 } from '@grafana/data';
import { Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { isLabelMatched } from './alertRoutingUtils';

interface AlertLabelsDisplayProps {
  alertLabels: Record<string, string>;
  highlightMatchers: LabelMatcher[];
}

export const AlertLabelsDisplay: React.FC<AlertLabelsDisplayProps> = ({ 
  alertLabels, 
  highlightMatchers 
}) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.section}>
      <Text variant="body">This alert includes the following labels:</Text>
      <div className={styles.labelsContainer}>
        {Object.entries(alertLabels).map(([key, value]) => {
          const isMatched = isLabelMatched(key, value, highlightMatchers);
          return (
            <div key={key} className={isMatched ? styles.labelChipHighlighted : styles.labelChip}>
              <Text variant="bodySmall">
                {key}={value}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    marginBottom: theme.spacing(1.5),
    '&:last-child': {
      marginBottom: 0,
    },
  }),

  labelsContainer: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }),

  labelChip: css({
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.secondary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
  }),

  labelChipHighlighted: css({
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    backgroundColor: theme.colors.primary.main,
    color: theme.colors.primary.contrastText,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
    fontWeight: theme.typography.fontWeightMedium,
    boxShadow: `0 1px 2px ${theme.colors.primary.shade}`,
  }),
});
