import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Icon, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckStatus } from 'types';
import { Toggletip } from 'components/Toggletip';

export interface CheckStatusInfoProps {
  description?: string;
  docsLink?: string;
  value?: CheckStatus;
}

export const CheckStatusInfo = ({ description, docsLink }: CheckStatusInfoProps) => {
  const styles = useStyles2((theme: GrafanaTheme2) => getStyles(theme));

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
        <button className={styles.infoLink} type="button">
          <Icon name={`info-circle`} size={'lg'} className={styles.infoIcon} />
        </button>
      </Toggletip>
    </Stack>
  );
};

export const NewStatusBadge = ({ status, className }: { status: CheckStatus; className?: string }) => {
  if (![CheckStatus.EXPERIMENTAL, CheckStatus.PRIVATE_PREVIEW, CheckStatus.PUBLIC_PREVIEW].includes(status)) {
    return null;
  }

  return <Badge text={'NEW'} color={'orange'} className={className} />;
};

const getStyles = (theme: GrafanaTheme2) => ({
  infoLink: css({
    background: `none`,
    border: `none`,
    padding: 0,
  }),
  infoIcon: css({
    color: theme.colors.info.main,
  }),
});
