import { ButtonGroup, useStyles } from '@grafana/ui';
import { CheckStatusPill } from 'components/CheckStatusPill';
import { CheckTypePill } from './CheckTypePill';
import React from 'react';
import { CheckType } from 'types';
import { GrafanaTheme } from '@grafana/data';
import { css } from 'emotion';

interface Props {
  checkType: CheckType;
  enabled: boolean;
}

const getStyles = (theme: GrafanaTheme) => ({
  marginRight: css`
    margin-right: ${theme.spacing.sm};
  `,
});

export const CheckStatusType = ({ checkType, enabled }: Props) => {
  const styles = useStyles(getStyles);
  return (
    <ButtonGroup>
      <CheckTypePill checkType={checkType} className={styles.marginRight} />
      <CheckStatusPill enabled={enabled} />
    </ButtonGroup>
  );
};
