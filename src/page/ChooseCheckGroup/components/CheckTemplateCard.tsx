import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconName, Stack, styleMixins, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { Card } from 'components/Card';

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
    <Card className={styles.card} data-testid={CHECKS_TEST_ID.templateCard}>
      <Stack alignItems="flex-start" direction="column" gap={1}>
        <Stack alignItems="center" direction="row" gap={1}>
          {icon && <Icon name={icon} size="lg" aria-hidden="true" />}
          <Card.Heading variant="h5">
            <button type="button" className={styles.action} disabled={disabled} onClick={onSelect}>
              {title}
            </button>
          </Card.Heading>
        </Stack>
        {description && <Text color="secondary">{description}</Text>}
      </Stack>
    </Card>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  action: css({
    all: 'unset',
    '&::after': {
      content: "''",
      position: 'absolute',
      inset: 0,
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
    },
    '&:focus-visible::after': styleMixins.getFocusStyles(theme),
    '&:disabled': { color: theme.colors.text.disabled },
    '&:disabled::after': { cursor: 'not-allowed' },
  }),
  card: css({
    minWidth: 0,
    overflow: 'hidden',
    textAlign: 'left',

    '> div:first-of-type': {
      height: '100%',
    },
  }),
});
