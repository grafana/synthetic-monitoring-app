import React, { useEffect, useRef, useContext, useCallback } from 'react';
import * as d3 from 'd3';
import * as d3hexbin from 'd3-hexbin';
import { Check } from 'types';
import { Spinner, useTheme2 } from '@grafana/ui';
import { SuccessRateContext } from 'contexts/SuccessRateContext';

interface Props {
  checks: Check[];
}

export function ChecksVisualization({ checks }: Props) {
  const svgEl = useRef(null);
  const theme = useTheme2();
  const { values, loading } = useContext(SuccessRateContext);

  // TODO: wrap this so there isn't a new instance on every render
  const getColor = (data, index) => {
    console.log('gettingColor');
    const check = checks[index];
    console.log(check);
    if (!check || !check?.enabled || !check.id) {
      return theme.colors.info.main;
    }
    const successRate = values.checks[check.id];
    if (successRate && successRate > 0.95) {
      return theme.colors.success.main;
    } else {
      return theme.colors.error.main;
    }
  };

  useEffect(() => {
    console.log('hellllo', values, checks.length);

    //SVG sizes and margins

    //The number of columns and rows of the heatmap
    const sideLength = Math.ceil(Math.sqrt(checks.length));

    const width = sideLength * 32;
    const height = sideLength * 32;
    //The maximum radius the hexagons can have to still fit the screen
    var hexRadius = d3.min([width / ((sideLength + 0.5) * Math.sqrt(3)), height / ((sideLength + 1 / 3) * 1.5)]);
    var hexCenters: Array<[number, number]> = [];

    if (!hexRadius) {
      return;
    }

    for (var i = 0; i < sideLength; i++) {
      for (var j = 0; j < sideLength; j++) {
        var x = hexRadius * j * Math.sqrt(3);
        //Offset each uneven row by half of a "hex-width" to the right
        if (i % 2 === 1) {
          x += (hexRadius * Math.sqrt(3)) / 2;
        }
        var y = hexRadius * i * 1.5;
        hexCenters.push([x, y]);
      }
    }

    var svg = d3
      .select(svgEl.current)
      .attr('width', width + hexRadius * 2)
      .attr('height', height + hexRadius * 2)
      .append('g')
      .attr('transform', 'translate(' + hexRadius + ',' + hexRadius + ')');

    //Set the hexagon radius
    var hexbin = d3hexbin.hexbin().radius(hexRadius);
    svg
      .append('g')
      .selectAll('.hexagon')
      .data(hexbin(hexCenters))
      .enter()
      .append('path')
      .attr('class', 'hexagon')
      .attr('d', function (d) {
        return 'M' + d.x + ',' + d.y + hexbin.hexagon();
      })
      .attr('stroke', theme.colors.getContrastText(theme.colors.background.secondary))
      .attr('stroke-width', '1px')
      .style('fill', (data, index) => {
        return getColor(data, index);
      });
  }, [checks, values, theme, getColor]);

  if (loading) {
    return <Spinner />;
  }

  // render svg element and use ref callback to store reference
  return <svg ref={svgEl} />;
}
