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
  labelCount?: number;
  labels?: Label[];
  calLabels?: Label[];
  onLabelClick?: (label: Label) => void;
}

export const CheckListItemDetails = ({
  frequency,
  activeSeries,
  probeLocations,
  executionsRate,
  className,
  labelCount,
  labels,
  calLabels,
  onLabelClick,
}: CheckListItemDetailsProps) => {
  const styles = useStyles2(getStyles);
  const activeSeriesMessage = activeSeries !== undefined ? `${activeSeries} active series` : null;
  const probeLocationsMessage = probeLocations === 1 ? `${probeLocations} location` : `${probeLocations} locations`;
  const executionRateMessage = executionsRate ? `${executionsRate} executions / month` : null;

  const hasCalLabels = (calLabels?.length ?? 0) > 0;

  return (
    <div className={cx(styles.checkDetails, className)}>
      {frequency / 1000}s frequency &nbsp;&nbsp;<strong>|</strong>&nbsp;&nbsp; {activeSeriesMessage}
      &nbsp;&nbsp;<strong>|</strong>&nbsp;&nbsp; {probeLocationsMessage}&nbsp;&nbsp;
      <strong>|</strong>&nbsp;&nbsp; {executionRateMessage}
      {labels && onLabelClick && (
        <>
          &nbsp;&nbsp;<strong>|</strong>
          <Tooltip
            placement="bottom-end"
            content={
              hasCalLabels ? (
                <Stack direction="column" gap={1}>
                  <div>
                    <div className={styles.tooltipSectionTitle}>Cost Attribution Labels</div>
                    <Stack justifyContent="flex-end" wrap="wrap" gap={0.5}>
                      {calLabels!.map((label: Label, index) => (
                        <CheckCardLabel
                          key={`cal-${index}`}
                          label={label}
                          onLabelSelect={onLabelClick}
                          colorIndex={4}
                        />
                      ))}
                    </Stack>
                  </div>
                  {labels.length > 0 && (
                    <div>
                      <div className={styles.tooltipSectionTitle}>Custom Labels</div>
                      <Stack justifyContent="flex-end" wrap="wrap" gap={0.5}>
                        {labels.map((label: Label, index) => (
                          <CheckCardLabel
                            key={index}
                            label={label}
                            onLabelSelect={onLabelClick}
                            className={styles.labelWidth}
                          />
                        ))}
                      </Stack>
                    </div>
                  )}
                </Stack>
              ) : (
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
              )
            }
          >
            <Button disabled={!labelCount || labelCount === 0} type="button" fill="text" size="sm">
              {hasCalLabels
                ? `View ${calLabels!.length} CAL${calLabels!.length === 1 ? '' : 's'}, ${labels.length} custom label${labels.length === 1 ? '' : 's'}`
                : `View ${labels.length} label${labels.length === 1 ? '' : 's'}`}
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  checkDetails: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: ${theme.typography.bodySmall.lineHeight};
    white-space: nowrap;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  labelWidth: css`
    max-width: 350px;
  `,
  tooltipSectionTitle: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(0.5),
  }),
});
