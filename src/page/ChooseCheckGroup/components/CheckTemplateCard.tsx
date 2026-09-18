import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Icon, IconName, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface Props {
  title: string;
  icon?: IconName;
  description?: string;
  checkType?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export function CheckTemplateCard({ title, icon, description, checkType, disabled, onSelect }: Props) {
  const styles = useStyles2(getStyles);
  return (
    <button type="button" className={styles.card} aria-label={title} disabled={disabled} onClick={onSelect}>
      <span className={styles.header}>
        <span className={styles.heading}>
          {icon && <Icon name={icon} size="lg" aria-hidden="true" />}
          <Text element="span" variant="h5">{title}</Text>
        </span>
        {checkType && <Badge color="darkgrey" text={checkType} />}
      </span>
      {description && <Text element="span" color="secondary">{description}</Text>}
    </button>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  header: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    width: '100%',
  }),
  heading: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    '& > svg': {
      flexShrink: 0,
    },
  }),
  card: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    width: '100%',
    textAlign: 'left',
    font: 'inherit',
    color: theme.colors.text.primary,
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    cursor: 'pointer',
    '&:hover:not(:disabled)': {
      background: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
      borderColor: theme.colors.border.medium,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary.main}`,
      outlineOffset: 2,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  }),
});
