import React, { useEffect, useRef, useContext, useState } from 'react';
import * as d3 from 'd3';
import * as d3hexbin from 'd3-hexbin';
import { Check } from 'types';
import { Spinner, Tooltip, useTheme2 } from '@grafana/ui';
import { SuccessRateContext } from 'contexts/SuccessRateContext';
import { getHexFillColor, getLayout, getMouseXY } from './checksVizUtils';

interface Props {
  checks: Check[];
}

export function ChecksVisualization({ checks }: Props) {
  const svgEl = useRef<SVGSVGElement>(null);
  const theme = useTheme2();
  const { values, loading } = useContext(SuccessRateContext);

  useEffect(() => {
    const { hexRadius, hexCenters, width, height } = getLayout(checks.length);

    if (!hexRadius || !svgEl.current || loading) {
      return;
    }

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('id', 'sm-check-viz-tooltip')
      .attr('class', 'polystat-panel-tooltip')
      .style('opacity', 0);

    var svg = d3
      .select(svgEl.current)
      .attr('width', width + hexRadius * 2)
      .attr('height', height + hexRadius * 2)
      .append('g')
      .attr('transform', `translate(${hexRadius + 1},${hexRadius + 1})`);

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
      .style('fill', function (data, index) {
        return getHexFillColor(data, index, checks, values);
      })
      .on('mousemove', () => {
        let { xpos, ypos } = getMouseXY();
        tooltip.style('left', xpos + 'px').style('top', ypos + 'px');
      })
      .on('mouseover', (d: any) => {
        let { xpos, ypos } = getMouseXY();
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html('hi')
          .style('font-size', '16px')
          .style('font-family', 'Roboto')
          .style('left', xpos + 'px')
          .style('top', ypos + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });
    // .on('mouseover', () => {
    //   console.log('mosing over');
    //   setShowTooltip(true);
    // });
    // .on('mouseout', () => setShowTooltip(false));
  }, [checks, values, theme, svgEl, loading]);

  // TODO: adding a loading state prevents the ref from getting set on mount. Use a callback ref?
  // if (loading) {
  //   return <Spinner />;
  // }

  // render svg element and use ref callback to store reference
  return (
    <div>
      {loading ? <Spinner /> : null}
      <svg ref={svgEl} />
    </div>
  );
}
