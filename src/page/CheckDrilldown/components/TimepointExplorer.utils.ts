import { colorManipulator } from '@grafana/data';
import { getTheme } from '@grafana/ui';

import { Timepoint } from 'page/CheckDrilldown/utils/constructTimepoints';

export type TimepointWithVis = Timepoint & {
  vis: {
    height: string;
    borderStyle: string;
    backgroundColor: string;
    borderColor: string;
  };
};

export function createVisualisation(timePoints: Timepoint[], explorerHeight: number, maxDuration: number) {
  return timePoints.map<TimepointWithVis>((timepoint) => {
    return {
      ...timepoint,
      vis: {
        height: getHeight(timepoint, maxDuration, explorerHeight),
        borderStyle: getBorderStyle(timepoint.uptime),
        ...getCachedColors(timepoint.uptime),
      },
    };
  });
}

// Memoize color calculations since they're expensive and depend only on uptime
const colorCache = new Map<0 | 1 | null, { backgroundColor: string; borderColor: string }>();

function getCachedColors(uptime: Timepoint['uptime']) {
  if (colorCache.has(uptime)) {
    return colorCache.get(uptime)!;
  }

  const colors = getColors(uptime);
  colorCache.set(uptime, colors);
  return colors;
}

function getHeight(timepoint: Timepoint, maxDuration: number, explorerHeight: number) {
  const percentage = timepoint.duration ? timepoint.duration / maxDuration : 0.75;
  const pixelHeight = percentage * (explorerHeight * 0.9); // 10% reserved height

  return `${pixelHeight}px`;
}

function getColors(uptime: Timepoint['uptime']) {
  const theme = getTheme();

  if (uptime === null) {
    const borderColor = theme.visualization.getColorByName('gray');

    return {
      backgroundColor: colorManipulator.alpha(borderColor, 0.5),
      borderColor,
    };
  }

  if (uptime === 0) {
    const borderColor = theme.visualization.getColorByName('red');

    return {
      backgroundColor: colorManipulator.alpha(borderColor, 0.5),
      borderColor,
    };
  }

  const borderColor = theme.visualization.getColorByName('green');

  return {
    backgroundColor: colorManipulator.alpha(borderColor, 0.5),
    borderColor,
  };
}

function getBorderStyle(uptime: Timepoint['uptime']) {
  if (uptime === null) {
    return 'dashed';
  }

  return 'solid';
}
