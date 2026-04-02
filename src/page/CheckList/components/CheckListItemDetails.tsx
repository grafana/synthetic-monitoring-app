import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import pluralize from 'pluralize';

import { Label } from 'types';
import { CheckCardLabel } from 'page/CheckList/components/CheckCardLabel';
import { UnattributedMessage } from 'page/CheckList/components/UnattributedMessage';

interface CheckListItemDetailsProps {
  frequency: number;
  activeSeries?: number;
  probeLocations: number;
  executionsRate?: number;
  className?: string;
  labels?: Label[];
  calLabels?: Label[];
  missingCalNames?: string[];
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
  calLabels,
  missingCalNames = [],
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
  const hasCalLabels = (calLabels?.length ?? 0) > 0;

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
              hasCalLabels ? (
                <Stack direction="column" gap={1}>
                  <div>
                    <div className={styles.tooltipSectionTitle}>Cost Attribution Labels</div>
                    <Stack justifyContent="flex-start" wrap="wrap" gap={0.5}>
                      {calLabels?.map((label: Label, index) => (
                        <CheckCardLabel
                          key={`cal-${label.name}`}
                          label={label}
                          onLabelSelect={onLabelClick}
                          colorIndex={1}
                        />
                      ))}
                    </Stack>
                  </div>
                  {labels.length > 0 && (
                    <div>
                      <div className={styles.tooltipSectionTitle}>Custom Labels</div>
                      <Stack justifyContent="flex-start" wrap="wrap" gap={0.5}>
                        {labels.map((label: Label, index) => (
                          <CheckCardLabel
                            key={label.name}
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
                <Stack justifyContent="flex-start" wrap={'wrap'}>
                  {labels.map((label: Label, index) => (
                    <CheckCardLabel
                      key={label.name}
                      label={label}
                      onLabelSelect={onLabelClick}
                      className={styles.labelWidth}
                    />
                  ))}
                </Stack>
              )
            }
          >
            <Button
              disabled={(labels?.length ?? 0) + (calLabels?.length ?? 0) === 0}
              type="button"
              fill="text"
              size="sm"
              className={cx({ [styles.wrapLabelButton]: layout === 'wrap' })}
            >
              {hasCalLabels
                ? `${calLabels!.length} ${calLabels!.length === 1 ? 'CAL' : 'CALs'}, ${labels.length} custom ${pluralize('label', labels.length)}`
                : `${labels.length} ${pluralize('label', labels.length)}`}
            </Button>
          </Tooltip>
        </>
      )}
      <UnattributedMessage missingCalNames={missingCalNames} />
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
  tooltipSectionTitle: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(0.5),
  }),
});
