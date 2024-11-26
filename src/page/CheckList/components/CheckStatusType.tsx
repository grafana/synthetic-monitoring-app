import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckType } from 'types';
import { CheckStatusPill } from 'page/CheckList/components/CheckStatusPill';
import { CheckTypePill } from 'page/CheckList/components/CheckTypePill';

interface CheckStatusTypeProps {
  checkType: CheckType;
  enabled: boolean;
  className?: string;
  onClickStatus?: (enabled: boolean) => void;
  onClickType?: (checkType: CheckType) => void;
}

export const CheckStatusType = ({
  checkType,
  enabled,
  onClickStatus,
  onClickType,
  className,
}: CheckStatusTypeProps) => {
  const styles = useStyles2(getStyles);
  return (
    <div className={cx(styles.container, className)}>
      <CheckTypePill checkType={checkType} className={styles.marginRight} onClick={onClickType} />
      <CheckStatusPill enabled={enabled} onClick={onClickStatus} />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
  `,
  marginRight: css`
    margin-right: ${theme.spacing(1)};
  `,
});
