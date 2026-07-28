import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { OpportunityConfidence, OpportunityValue } from './types';

interface OpportunitySignalBadgesProps {
  value: OpportunityValue;
  confidence: OpportunityConfidence;
  ariaLabel: string;
  compact?: boolean;
}

export function OpportunitySignalBadges({
  value,
  confidence,
  ariaLabel,
  compact = false,
}: OpportunitySignalBadgesProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.badges, { [styles.compact]: compact })} aria-label={ariaLabel}>
      <Badge color={value === 'high' ? 'orange' : 'darkgrey'} text={`${capitalize(value)} value`} />
      <Badge color={confidence === 'high' ? 'green' : 'darkgrey'} text={`${capitalize(confidence)} confidence`} />
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const getStyles = (theme: GrafanaTheme2) => ({
  badges: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75),
  }),
  compact: css({
    gap: theme.spacing(0.5),
  }),
});
