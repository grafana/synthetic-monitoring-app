import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, BadgeColor, Icon, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckStatus } from 'types';
import { Toggletip } from 'components/Toggletip';

export interface CheckStatusBadgeProps {
  value: CheckStatus;
  description?: string;
  docsLink?: string;
}

const colorMap: Record<CheckStatus, { text: string; color: BadgeColor }> = {
  [CheckStatus.EXPERIMENTAL]: {
    color: 'orange',
    text: `Experimental`,
  },
  [CheckStatus.PRIVATE_PREVIEW]: {
    color: 'purple',
    text: `Private preview`,
  },
  [CheckStatus.PUBLIC_PREVIEW]: {
    color: 'green',
    text: `Public preview`,
  },
};

export const CheckStatusBadge = ({ description, docsLink, value }: CheckStatusBadgeProps) => {
  const { text, color } = colorMap[value];
  const styles = useStyles2((theme: GrafanaTheme2) => getStyles(theme, color));

  return (
    <Stack>
      <Toggletip
        content={
          <div>
            {description}
            {docsLink && (
              <>
                {` `}
                <TextLink href={docsLink} external variant="bodySmall">
                  Read more
                </TextLink>
              </>
            )}
          </div>
        }
      >
        <button className={styles.badgeLink} type="button">
          <Badge
            text={
              <Stack gap={0.5} alignItems={`center`}>
                <div>{text}</div>
                <Icon name={`info-circle`} size="sm" />
              </Stack>
            }
            color={color}
          />
        </button>
      </Toggletip>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2, color: string) => ({
  badgeLink: css({
    background: `none`,
    border: `none`,
    padding: 0,

    '&:hover': {
      background: theme.colors.emphasize(theme.visualization.getColorByName(color), 0.15),
    },
  }),
});
