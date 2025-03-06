import React, { PropsWithChildren, useState } from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, IconButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

type CheckInsightProps = {
  label: string;
  health: `good` | `bad` | `warn` | `unknown`;
  description: string;
};

const iconMap: Record<CheckInsightProps['health'], IconName> = {
  good: 'check',
  bad: 'times',
  warn: 'exclamation-triangle',
  unknown: 'question-circle',
};

const colorMap: Record<CheckInsightProps['health'], string> = {
  good: 'green',
  bad: 'red',
  warn: 'yellow',
  unknown: 'gray',
};

export const CheckInsight = ({ label, health, description, children }: PropsWithChildren<CheckInsightProps>) => {
  const [open, setOpen] = useState(false);
  const icon = iconMap[health];
  const color = colorMap[health];
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Stack justifyContent="space-between">
        <Stack alignItems="center">
          <Icon name={icon} color={color} size="lg" />
          <Text>{label}</Text>
          <Text>-</Text>
          <Text>{description}</Text>
        </Stack>
        <IconButton
          aria-label={open ? 'Collapse' : 'Expand'}
          name={open ? 'angle-up' : 'angle-down'}
          size="lg"
          onClick={() => setOpen(!open)}
        />
      </Stack>
      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      border: 1px solid ${theme.colors.border.weak};
      padding: ${theme.spacing(2)};
      gap: ${theme.spacing(2)};
    `,
    content: css`
      padding: ${theme.spacing(2)};
    `,
  };
};
