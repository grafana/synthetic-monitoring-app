import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Card, Icon, IconName, Text, useStyles2 } from '@grafana/ui';
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
    <Card noMargin onClick={onSelect} disabled={disabled} role="group" aria-label={title} aria-disabled={disabled}>
      <Card.Heading aria-label={title}>
        <span className={styles.heading}>
          {icon && <Icon name={icon} size="lg" aria-hidden="true" />}
          <Text element="span" variant="h5">{title}</Text>
        </span>
      </Card.Heading>
      {checkType && <Card.Tags><Badge color="darkgrey" text={checkType} /></Card.Tags>}
      {description && <Card.Description>{description}</Card.Description>}
    </Card>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  heading: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    '& > svg': {
      flexShrink: 0,
    },
  }),
});
