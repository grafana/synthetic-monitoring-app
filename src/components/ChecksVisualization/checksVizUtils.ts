import { config } from '@grafana/runtime';
import { SuccessRates } from 'contexts/SuccessRateContext';
import * as d3 from 'd3';
import { Check } from 'types';

// TODO: wrap this so there isn't a new instance on every render
export const getHexFillColor = (check: Check, successRates: SuccessRates) => {
  const theme = config.theme2;
  if (!check) {
    return theme.colors.background.secondary;
  }
  if (!check?.enabled || !check.id) {
    return theme.colors.secondary.shade;
  }
  const successRate = successRates.checks[check.id];

  if (successRate === undefined) {
    return theme.colors.secondary.shade;
  }

  if (successRate && successRate > 0.9) {
    return theme.colors.success.main;
  } else {
    return theme.colors.error.main;
  }
};

export const getLayout = (checksLength: number, width: number) => {
  const sideLength = Math.ceil(Math.sqrt(checksLength));
  const trimmedWidth = width - 32;
  const hexSize = 42;
  const needsWrap = sideLength * hexSize > trimmedWidth;
  //The number of columns and rows of the heatmap
  const columnCount = needsWrap ? Math.floor(trimmedWidth / hexSize) : sideLength;
  const rowCount = needsWrap ? Math.ceil(checksLength / columnCount) : sideLength;

  //The maximum radius the hexagons can have to still fit the screen
  var hexRadius =
    d3.min([width / ((columnCount + 0.5) * Math.sqrt(3)), (rowCount * hexSize) / ((rowCount + 1 / 3) * 1.5)]) ?? 0;

  var hexCenters: Array<[number, number]> = [];

  for (var i = 0; i < rowCount; i++) {
    for (var j = 0; j < columnCount; j++) {
      var x = hexRadius * j * Math.sqrt(3);
      //Offset each uneven row by half of a "hex-width" to the right
      if (i % 2 === 1) {
        x += (hexRadius * Math.sqrt(3)) / 2;
      }
      var y = hexRadius * i * 1.5;
      if (hexCenters.length < checksLength) {
        hexCenters.push([x, y]);
      }
    }
  }

  return { svgWidth: columnCount * hexSize + hexSize * 2, height: rowCount * hexSize, hexRadius, hexCenters };
};
