import { GrafanaTheme } from '@grafana/data';
import { Button, HorizontalGroup, Tooltip, useStyles } from '@grafana/ui';
import React from 'react';
import { css, cx } from 'emotion';
import { Label } from 'types';
import { CheckCardLabel } from 'components/CheckCardLabel';

const getStyles = (theme: GrafanaTheme) => ({
  checkDetails: css`
    font-size: ${theme.typography.size.sm};
    line-height: ${theme.typography.lineHeight.sm};
    white-space: nowrap;
    display: flex;
    align-items: center;
    width: 284px;
  `,
  labelWidth: css`
    max-width: 350px;
  `,
});

interface Props {
  frequency: number;
  activeSeries: number;
  className?: string;
  labelCount?: number;
  labels?: Label[];
  onLabelClick?: (label: Label) => void;
}

export const CheckListItemDetails = ({ frequency, activeSeries, className, labels, onLabelClick }: Props) => {
  const styles = useStyles(getStyles);
  return (
    <div className={cx(styles.checkDetails, className)}>
      {frequency / 1000}s frequency &nbsp;&nbsp;<strong>|</strong>&nbsp;&nbsp; {activeSeries} active series
      {labels && onLabelClick && (
        <>
          &nbsp;&nbsp;<strong>|</strong>
          <Tooltip
            placement="bottom-end"
            content={
              <HorizontalGroup justify="flex-end" wrap>
                {labels.map((label: Label, index) => (
                  <CheckCardLabel
                    key={index}
                    label={label}
                    onLabelSelect={onLabelClick}
                    className={styles.labelWidth}
                  />
                ))}
              </HorizontalGroup>
            }
          >
            <Button disabled={labels.length === 0} type="button" variant="link" size="sm">
              View {labels.length} label{labels.length === 1 ? '' : 's'}
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
};
