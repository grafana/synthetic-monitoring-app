import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { ColorPicker, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { PlainButton } from 'components/PlainButton';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

const VIZ_STATES = [`failure`, `success`, `unknown`] as const;

export const TimepointListVizLegend = () => {
  const styles = useStyles2(getStyles);
  const { handleVizDisplayChange, vizDisplay, vizOptions, handleVizOptionChange } = useTimepointExplorerContext();

  return (
    <Stack gap={1.5}>
      {VIZ_STATES.map((value) => {
        const isSelected = vizDisplay.includes(value);

        return (
          <Stack key={value} alignItems="center">
            <ColorPicker color={vizOptions[value]} onChange={(color) => handleVizOptionChange(value, color)}>
              {({ ref, showColorPicker, hideColorPicker }) => (
                <PlainButton
                  onClick={() => {
                    showColorPicker();
                  }}
                  onMouseLeave={hideColorPicker}
                >
                  <TimepointVizItem ref={ref} className={styles.legendItem} state={value} />
                </PlainButton>
              )}
            </ColorPicker>
            <PlainButton
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                const { ctrlKey, metaKey, shiftKey } = event;
                const usedModifier = ctrlKey || shiftKey || metaKey;

                handleVizDisplayChange(value, usedModifier);
              }}
            >
              <Text color={isSelected ? 'primary' : 'disabled'}>{value}</Text>
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
