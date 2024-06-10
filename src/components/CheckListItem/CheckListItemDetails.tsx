import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { Label } from 'types';
import { CheckCardLabel } from 'components/CheckCardLabel';

const getStyles = (theme: GrafanaTheme2) => ({
  checkDetails: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: ${theme.typography.bodySmall.lineHeight};
    white-space: nowrap;
    display: flex;
    align-items: center;
    width: 400px;
  `,
  labelWidth: css`
    max-width: 350px;
  `,
});

interface Props {
  frequency: number;
  activeSeries?: number;
  probeLocations: number;
  className?: string;
  labelCount?: number;
  labels?: Label[];
  onLabelClick?: (label: Label) => void;
}

export const CheckListItemDetails = ({
  frequency,
  activeSeries,
  probeLocations,
  className,
  labels,
  onLabelClick,
}: Props) => {
  const styles = useStyles2(getStyles);
  const activeSeriesMessage = activeSeries !== undefined ? `${activeSeries} active series` : null;
  const probeLocationsMessage = probeLocations === 1 ? `${probeLocations} location` : `${probeLocations} locations`;
  return (
    <div className={cx(styles.checkDetails, className)}>
      {frequency / 1000}s frequency &nbsp;&nbsp;<strong>|</strong>&nbsp;&nbsp; {activeSeriesMessage}
      &nbsp;&nbsp;<strong>|</strong>&nbsp;&nbsp; {probeLocationsMessage}
      {labels && onLabelClick && (
        <>
          &nbsp;&nbsp;<strong>|</strong>
          <Tooltip
            placement="bottom-end"
            content={
              <Stack justifyContent="flex-end" wrap={'wrap'}>
                {labels.map((label: Label, index) => (
                  <CheckCardLabel
                    key={index}
                    label={label}
                    onLabelSelect={onLabelClick}
                    className={styles.labelWidth}
                  />
                ))}
              </Stack>
            }
          >
            <Button disabled={labels.length === 0} type="button" fill="text" size="sm">
              View {labels.length} label{labels.length === 1 ? '' : 's'}
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
};
