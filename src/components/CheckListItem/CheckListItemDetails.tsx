import { GrafanaTheme } from '@grafana/data';
import { useStyles } from '@grafana/ui';
import React from 'react';
import { css } from 'emotion';

const getStyles = (theme: GrafanaTheme) => ({
  checkDetails: css`
    font-size: ${theme.typography.size.sm};
    line-height: ${theme.typography.lineHeight.sm};
    margin-bottom: ${theme.spacing.sm};
  `,
});

interface Props {
  checkType: string;
  frequency: number;
  activeSeries: number;
}

export const CheckListItemDetails = ({ checkType, frequency, activeSeries }: Props) => {
  const styles = useStyles(getStyles);
  return (
    <div className={styles.checkDetails}>
      {checkType.toUpperCase()} &nbsp;&nbsp;<strong>|</strong>&nbsp;&nbsp; {frequency / 1000}s frequency &nbsp;&nbsp;
      <strong>|</strong>&nbsp;&nbsp; {activeSeries} active series
    </div>
  );
};
