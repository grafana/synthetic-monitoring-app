import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface InboxDisclosureProps {
  summary: string;
  children: React.ReactNode;
  inline?: boolean;
}

export function InboxDisclosure({ summary, children, inline }: InboxDisclosureProps) {
  const styles = useStyles2(getStyles);

  return (
    <details className={cx(styles.disclosure, inline && styles.inlineDisclosure)}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  disclosure: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    marginTop: theme.spacing(1.5),
    '& summary': {
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      padding: theme.spacing(1.25, 0),
      '&:hover': {
        background: theme.colors.action.hover,
        color: theme.colors.text.primary,
      },
      '&:focus-visible': {
        borderRadius: theme.shape.radius.default,
        outline: `2px solid ${theme.colors.primary.border}`,
        outlineOffset: -2,
      },
    },
  }),
  inlineDisclosure: css({
    borderTop: 0,
    marginTop: 0,
    '& summary': {
      padding: theme.spacing(0.5, 0),
    },
  }),
});
