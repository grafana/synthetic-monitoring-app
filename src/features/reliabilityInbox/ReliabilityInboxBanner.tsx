import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useReliabilityInboxSuggestions } from './data';
import { ReliabilityInboxPanel } from './ReliabilityInboxPage';

export function ReliabilityInboxBanner() {
  const styles = useStyles2(getStyles);
  const { data: opportunities = [] } = useReliabilityInboxSuggestions();
  const [expanded, setExpanded] = useState(false);

  if (opportunities.length === 0) {
    return null;
  }

  if (expanded) {
    return (
      <section className={styles.expanded} aria-label="Potential coverage gaps">
        <ReliabilityInboxPanel embedded onCollapse={() => setExpanded(false)} />
      </section>
    );
  }

  return (
    <div className={styles.banner}>
      <div className={styles.message}>
        <Icon name="ai-sparkle" className={styles.icon} />
        <span>
          <strong>
            {opportunities.length} potential coverage {opportunities.length === 1 ? 'gap' : 'gaps'} found
          </strong>{' '}
          based on observed request activity and your current Synthetic Monitoring configuration.
        </span>
      </div>
      <Button icon="ai-sparkle" size="sm" aria-expanded={expanded} onClick={() => setExpanded(true)}>
        Review opportunities
      </Button>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  banner: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    border: `1px solid ${theme.colors.info.border}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.info.transparent,
    flexWrap: 'wrap',
  }),
  expanded: css({
    display: 'block',
    minWidth: 0,
    padding: theme.spacing(2),
    border: `1px solid ${theme.colors.info.border}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
  }),
  message: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.colors.text.secondary,
  }),
  icon: css({
    color: theme.colors.info.text,
    flexShrink: 0,
  }),
});
