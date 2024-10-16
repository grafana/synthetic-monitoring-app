import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Icon, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ProtocolOption } from 'hooks/useCheckTypeGroupOptions';
import { Toggletip } from 'components/Toggletip';

const BADGE_COLOR = `blue`;

export const Protocol = ({ href, label, tooltip }: ProtocolOption) => {
  const styles = useStyles2(getStyles);

  if (tooltip) {
    return (
      <Toggletip content={<div>{tooltip}</div>}>
        <button className={styles.badgeLink}>
          <Badge
            text={
              <Stack gap={0.5} alignItems={`center`}>
                <div>{label}</div>
                <Icon name={`info-circle`} size="sm" />
              </Stack>
            }
            color={BADGE_COLOR}
          />
        </button>
      </Toggletip>
    );
  }

  if (href) {
    return (
      <a className={styles.badgeLink} href={href}>
        <Badge text={label} color={BADGE_COLOR} />
      </a>
    );
  }

  return <Badge text={label} color={BADGE_COLOR} />;
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
