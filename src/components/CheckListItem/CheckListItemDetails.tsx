import { GrafanaTheme } from '@grafana/data';
import { Button, useStyles } from '@grafana/ui';
import React from 'react';
import { css, cx } from 'emotion';

const getStyles = (theme: GrafanaTheme) => ({
  checkDetails: css`
    font-size: ${theme.typography.size.sm};
    line-height: ${theme.typography.lineHeight.sm};
    white-space: nowrap;
    display: flex;
    align-items: center;
    width: 284px;
    margin-bottom: ${theme.spacing.sm};
  `,
});

interface Props {
  frequency: number;
  activeSeries: number;
  className?: string;
  onViewLabelsClick?: () => void;
}

export const CheckListItemDetails = ({ frequency, activeSeries, className, onViewLabelsClick }: Props) => {
  const styles = useStyles(getStyles);
  return (
    <div className={cx(styles.checkDetails, className)}>
      {frequency / 1000}s frequency &nbsp;&nbsp;<strong>|</strong>&nbsp;&nbsp; {activeSeries} active series
      {onViewLabelsClick && (
        <>
          &nbsp;&nbsp;<strong>|</strong>
          <Button type="button" variant="link" size="sm" onClick={onViewLabelsClick}>
            View labels
          </Button>
        </>
      )}
    </div>
  );
};
