import React, { useEffect, useRef, useContext } from 'react';
import * as d3 from 'd3';
import * as d3hexbin from 'd3-hexbin';
import { Check } from 'types';
import { useTheme2 } from '@grafana/ui';
import { SuccessRateContext } from 'contexts/SuccessRateContext';
import { getHexFillColor, getLayout } from './checksVizUtils';

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
      });
  }, [checks, values, theme, svgEl, loading]);

  // TODO: adding a loading state prevents the ref from getting set on mount. Use a callback ref?
  // if (loading) {
  //   return <Spinner />;
  // }

  // render svg element and use ref callback to store reference
  return <svg ref={svgEl} />;
}
