import React, { useCallback } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { ColorPicker, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackTimepointVizLegendColorClicked } from 'features/tracking/timepointExplorerEvents';

import { PlainButton } from 'components/PlainButton';
import { VIZ_DISPLAY_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { TimepointStatus } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

export const TimepointListVizLegend = () => {
  const styles = useStyles2(getStyles);
  const { handleVizDisplayChange, vizDisplay, vizOptions, handleVizOptionChange } = useTimepointExplorerContext();

  const handleVizOptionClick = useCallback(
    (status: TimepointStatus, color: string) => {
      trackTimepointVizLegendColorClicked({
        vizOption: status,
        color,
      });
      handleVizOptionChange(status, color);
    },
    [handleVizOptionChange]
  );

  return (
    <Stack gap={1.5}>
      {VIZ_DISPLAY_OPTIONS.map((status) => {
        const isSelected = vizDisplay.includes(status);

        return (
          <Stack key={status} alignItems="center">
            <ColorPicker color={vizOptions[status]} onChange={(color) => handleVizOptionClick(status, color)}>
              {({ ref, showColorPicker, hideColorPicker }) => (
                <PlainButton
                  onClick={() => {
                    showColorPicker();
                  }}
                  onMouseLeave={hideColorPicker}
                >
                  <TimepointVizItem ref={ref} className={styles.legendItem} status={status} />
                </PlainButton>
              )}
            </ColorPicker>
            <PlainButton
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                const { ctrlKey, metaKey, shiftKey } = event;
                const usedModifier = ctrlKey || shiftKey || metaKey;

                handleVizDisplayChange(status, usedModifier);
              }}
            >
              <Text color={isSelected ? 'primary' : 'disabled'}>{status}</Text>
            </PlainButton>
          </Stack>
        );
      })}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  legendItem: css`
    width: 14px;
    height: 4px;
    border-radius: ${theme.shape.radius.pill};
  `,
});
