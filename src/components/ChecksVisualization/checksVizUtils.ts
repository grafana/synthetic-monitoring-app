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

export const getLayout = (checksLength: number) => {
  //SVG sizes and margins

  //The number of columns and rows of the heatmap
  const sideLength = Math.ceil(Math.sqrt(checksLength));

  const width = sideLength * 64;
  const height = sideLength * 64;
  //The maximum radius the hexagons can have to still fit the screen
  var hexRadius = d3.min([width / ((sideLength + 0.5) * Math.sqrt(3)), height / ((sideLength + 1 / 3) * 1.5)]) ?? 0;
  var hexCenters: Array<[number, number]> = [];

  for (var i = 0; i < sideLength; i++) {
    for (var j = 0; j < sideLength; j++) {
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

  return { width, height, hexRadius, hexCenters };
};
