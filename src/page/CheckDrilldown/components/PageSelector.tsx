import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { getTheme, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useCheckDrilldownInfo } from 'page/CheckDrilldown/hooks/useCheckDrilldownInfo';
import { getColor } from 'page/CheckDrilldown/utils/colors';

export const PageSelector = ({
  containerWidth,
  currentPage,
  totalPages,
  onGoToPage,
  timepointsToDisplay,
}: {
  containerWidth: number;
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
  timepointsToDisplay: number;
}) => {
  const { uptime = [] } = useCheckDrilldownInfo();
  const usable = uptime || [];
  const uptimeValues = usable.map((uptime) => uptime[1]);
  const uptimeWidth = (containerWidth + 40) / uptimeValues.length;
  const styles = useStyles2(getStyles);
  const theme = getTheme();
  const red = getColor('red');
  const green = getColor('green');
  const sections = divideUpTimepoints(uptimeValues.reverse(), timepointsToDisplay, totalPages);

  return (
    <Stack gap={0}>
      {sections.reverse().map((section, index) => {
        const reversedIndex = totalPages - 1 - index;
        const isActive = currentPage === reversedIndex;
        const outline = isActive ? `3px solid ${theme.colors.formFocusOutline}` : 'none';

        return (
          <button key={index} className={styles.button} onClick={() => onGoToPage(reversedIndex)} style={{ outline }}>
            {section.reverse().map((val, index) => {
              const backgroundColor = val === 1 ? green : red;

              return <div key={index} className={styles.value} style={{ width: uptimeWidth, backgroundColor }} />;
            })}
          </button>
        );
      })}
    </Stack>
  );
};

function divideUpTimepoints(uptimeValues: number[], timepointsToDisplay: number, totalPages: number) {
  let sections: number[][] = Array(totalPages).fill([]);

  for (let i = 0; i < uptimeValues.length; i++) {
    const page = Math.floor(i / timepointsToDisplay);
    sections[page] = [...(sections[page] || []), uptimeValues[i]];
  }

  return sections;
}

const getStyles = (theme: GrafanaTheme2) => ({
  button: css`
    border: 0;
    padding: 0;
    display: flex;
    background-color: transparent;

    &:hover {
      background: ${theme.colors.action.hover};
    }
  `,
  value: css`
    background-color: ${theme.colors.background.secondary};
    width: 1px;
    height: 30px;
  `,
});
