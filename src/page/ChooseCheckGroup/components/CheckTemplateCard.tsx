import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Card, Icon, IconName, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface Props {
  title: string;
  icon?: IconName;
  description?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export function CheckTemplateCard({ title, icon, description, disabled, onSelect }: Props) {
  const styles = useStyles2(getStyles);
  return (
    <Card
      className={styles.card}
      noMargin
      onClick={onSelect}
      disabled={disabled}
      role="group"
      aria-label={title}
      aria-disabled={disabled}
    >
      <Card.Heading className={styles.headingContainer} aria-label={title}>
        <span className={styles.heading}>
          {icon && <Icon name={icon} size="lg" aria-hidden="true" />}
          <Text element="span" variant="h5">
            {title}
          </Text>
        </span>
      </Card.Heading>
      {description && <Card.Description>{description}</Card.Description>}
    </Card>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({ textAlign: 'center' }),
  headingContainer: css({ justifyContent: 'center' }),
  heading: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    '& > svg': {
      flexShrink: 0,
    },
  }),
});
