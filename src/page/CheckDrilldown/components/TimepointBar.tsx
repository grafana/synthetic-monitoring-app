import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Icon, Stack, Text, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatDate } from 'utils';
import { ResultDuration } from 'page/CheckDrilldown/components/ResultDuration';
import { TimepointWithVis } from 'page/CheckDrilldown/components/TimepointExplorer.utils';
import { TimepointProbeResults } from 'page/CheckDrilldown/components/TimepointProbeResults';

interface TimepointBarProps {
  timepoint: TimepointWithVis;
  onClick: () => void;
  isSelected: boolean;
}

export const TimepointBar = ({ timepoint, onClick, isSelected }: TimepointBarProps) => {
  const styles = useStyles2((theme) => getStyles(theme, isSelected));

  const button = (
    <button aria-label={`${timepoint.uptime} uptime`} className={styles.timepoint} onClick={onClick}>
      {isSelected && <Icon name="eye" />}
      <div
        className={styles.timepointContent}
        style={{
          backgroundColor: timepoint.vis.backgroundColor,
          borderColor: timepoint.vis.borderColor,
          borderStyle: timepoint.vis.borderStyle,
          height: timepoint.vis.height,
          color: timepoint.vis.borderColor,
        }}
      >
        {timepoint.uptime !== null && <Icon name={timepoint.uptime ? 'check' : 'times'} />}
      </div>
    </button>
  );

  if (!timepoint.uptime && timepoint.duration === null) {
    return button;
  }

  return (
    <Tooltip interactive content={<TooltipContent timepoint={timepoint} />} key={timepoint.timestamp} placement="top">
      {button}
    </Tooltip>
  );
};

const TooltipContent = ({ timepoint }: { timepoint: TimepointWithVis }) => {
  const styles = useStyles2(getTooltipContentStyles);

  return (
    <div>
      <div className={styles.tooltipHeader}>
        <Text variant="body" element="h3">
          {formatDate(timepoint.timestamp || ``, true)}
        </Text>
      </div>
      <Stack>
        <Duration timepoint={timepoint} />
      </Stack>
    </div>
  );
};

const Duration = ({ timepoint }: { timepoint: TimepointWithVis }) => {
  return (
    <Stack direction={`column`}>
      <Box padding={1}>
        <Stack direction={`row`} gap={1} justifyContent={`space-between`}>
          <Text variant="bodySmall" element="h3">
            Check result
          </Text>
          <ResultDuration state={timepoint.uptime} duration={timepoint.duration} type={`up_down`} />
        </Stack>
        <TimepointProbeResults timepoint={timepoint} />
      </Box>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2, isSelected: boolean) => ({
  timepoint: css`
    background-color: transparent;
    border-color: transparent;
    padding: 0;
    margin: 0;
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: center;
    flex-direction: column;

    &:hover {
      background: ${theme.colors.action.hover};
    }
  `,
  timepointContent: css`
    display: flex;
    align-items: flex-end;
    justify-content: center;
    min-height: 20px;
    width: 20px;
    border-width: 1px;
    flex-shrink: 0;
    border-radius: ${theme.shape.radius.default};
    position: relative;

    &:after {
      content: '';
      display: block;
      width: calc(100% + 8px);
      height: calc(100% + 8px);
      border: ${isSelected ? `2px solid ${theme.colors.primary.main}` : `none`};
      border-radius: ${theme.shape.radius.default};
      position: absolute;
      top: -4px;
      left: -4px;
      pointer-events: none;
    }
  `,
  tooltipHeader: css`
    padding: ${theme.spacing(1)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
});

const getTooltipContentStyles = (theme: GrafanaTheme2) => ({
  tooltipHeader: css`
    padding: ${theme.spacing(1)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
});
