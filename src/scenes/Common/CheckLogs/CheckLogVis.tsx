import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { LabelsWithTime } from 'features/parseCheckLogs/checkLogs.types';

interface CheckLogVisProps {
  check: LabelsWithTime[];
  onClick: () => void;
  isSelected: boolean;
}

export const CheckLogVis = ({ check, onClick, isSelected }: CheckLogVisProps) => {
  const isSuccess = check[0].value.probe_success === '1';
  const styles = useStyles2((theme) => getStyles(theme, isSuccess, isSelected));

  return <button aria-label={`${check[0].value.msg}`} className={styles.container} onClick={onClick} />;
};

const getStyles = (theme: GrafanaTheme2, isSuccess: boolean, isSelected: boolean) => {
  return {
    container: css`
      padding: ${theme.spacing(2)};
      background: ${isSuccess ? theme.colors.success.main : theme.colors.error.main};
      border-style: solid;
      border-width: 2px;
      border-radius: 4px;
      border-color: ${isSelected ? theme.colors.primary.main : 'transparent'};
      width: 50px;
      height: 50px;
    `,
  };
};
