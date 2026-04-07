import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { Label } from 'types';
import { CheckCardLabel } from 'page/CheckList/components/CheckCardLabel';

interface CheckListItemDetailsProps {
  frequency: number;
  activeSeries?: number;
  probeLocations: number;
  executionsRate?: number;
  className?: string;
  labels?: Label[];
  onLabelClick?: (label: Label) => void;
  layout?: 'inline' | 'wrap';
}

export const CheckListItemDetails = ({
  frequency,
  activeSeries,
  probeLocations,
  executionsRate,
  className,
  labels,
  onLabelClick,
  layout = 'inline',
}: CheckListItemDetailsProps) => {
  const styles = useStyles2(getStyles);
  const activeSeriesMessage = activeSeries !== undefined ? `${activeSeries} active series` : null;
  const probeLocationsMessage = probeLocations === 1 ? `${probeLocations} location` : `${probeLocations} locations`;
  const executionRateMessage = executionsRate ? `${executionsRate} executions / month` : null;
  const detailItems = [
    `${frequency / 1000}s frequency`,
    activeSeriesMessage,
    probeLocationsMessage,
    executionRateMessage,
  ].filter((item): item is string => Boolean(item));

  return (
    <div
      className={cx(styles.checkDetails, className, {
        [styles.inlineLayout]: layout === 'inline',
        [styles.wrapLayout]: layout === 'wrap',
      })}
    >
      {detailItems.map((item, index) => (
        <React.Fragment key={`${item}-${index}`}>
          {layout === 'inline' && index > 0 && (
            <span className={styles.separator} aria-hidden="true">
              |
            </span>
          )}
          <span className={cx(styles.detailItem, { [styles.wrapDetailItem]: layout === 'wrap' })}>{item}</span>
        </React.Fragment>
      ))}
      {labels && onLabelClick && (
        <>
          {layout === 'inline' && detailItems.length > 0 && (
            <span className={styles.separator} aria-hidden="true">
              |
            </span>
          )}
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
            <Button
              disabled={labels.length === 0}
              type="button"
              fill="text"
              size="sm"
              className={cx({ [styles.wrapLabelButton]: layout === 'wrap' })}
            >
              View {labels.length} label{labels.length === 1 ? '' : 's'}
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  checkDetails: css({
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.bodySmall.lineHeight,
    minWidth: 0,
  }),
  inlineLayout: css({
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  wrapLayout: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }),
  detailItem: css({
    minWidth: 0,
    fontVariantNumeric: 'tabular-nums',
  }),
  wrapDetailItem: css({
    backgroundColor: theme.colors.background.primary,
    borderRadius: '2px',
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  }),
  separator: css({
    padding: `0 ${theme.spacing(1)}`,
    flexShrink: 0,
  }),
  wrapLabelButton: css({
    paddingLeft: 0,
    paddingRight: 0,
  }),
  labelWidth: css({
    maxWidth: '350px',
  }),
});
