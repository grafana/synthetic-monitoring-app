import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ProtocolOption } from 'hooks/useCheckTypeGroupOptions';
import { Toggletip } from 'components/Toggletip';

const BADGE_COLOR = `blue`;

export const Protocol = ({ href, label, tooltip }: ProtocolOption) => {
  const styles = useStyles2(getStyles);

  if (tooltip) {
    return (
      <Toggletip content={<div>{tooltip}</div>}>
        <div className={styles.badgeLink}>
          <Stack gap={0.5} alignItems={`center`}>
            <span>{label}</span>
            <Icon name={`info-circle`} size="sm" />
          </Stack>
        </div>
      </Toggletip>
    );
  }

  if (href) {
    return (
      <TextLink className={styles.badgeLink} href={href} inline={false} color="secondary">
        {label}
      </TextLink>
    );
  }

  return <span>{label}</span>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  badgeLink: css({
    background: `none`,
    border: `none`,
    padding: 0,

    '&:hover': {
      background: theme.colors.emphasize(theme.visualization.getColorByName(BADGE_COLOR), 0.15),
    },
  }),
});
