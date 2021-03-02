import { useStyles } from '@grafana/ui';
import { CheckStatusPill } from 'components/CheckStatusPill';
import { CheckTypePill } from './CheckTypePill';
import React from 'react';
import { CheckType } from 'types';
import { GrafanaTheme } from '@grafana/data';
import { css, cx } from 'emotion';

interface Props {
  checkType: CheckType;
  enabled: boolean;
  className?: string;
  onClickStatus?: (enabled: boolean) => void;
  onClickType?: (checkType: CheckType) => void;
}

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
  `,
  marginRight: css`
    margin-right: ${theme.spacing.sm};
  `,
});

export const CheckStatusType = ({ checkType, enabled, onClickStatus, onClickType, className }: Props) => {
  const styles = useStyles(getStyles);
  return (
    <div className={cx(styles.container, className)}>
      <CheckTypePill checkType={checkType} className={styles.marginRight} onClick={onClickType} />
      <CheckStatusPill enabled={enabled} onClick={onClickStatus} />
    </div>
  );
};
