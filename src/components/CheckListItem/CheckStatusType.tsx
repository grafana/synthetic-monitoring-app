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
  onClickStatus?: (enabled: boolean) => void;
  onClickType?: (checkType: CheckType) => void;
}

const getStyles = (theme: GrafanaTheme) => ({
  marginRight: css`
    margin-right: ${theme.spacing.sm};
  `,
});

export const CheckStatusType = ({ checkType, enabled, onClickStatus, onClickType }: Props) => {
  const styles = useStyles(getStyles);
  return (
    <ButtonGroup>
      <CheckTypePill checkType={checkType} className={styles.marginRight} onClick={onClickType} />
      <CheckStatusPill enabled={enabled} onClick={onClickStatus} />
    </ButtonGroup>
  );
};
