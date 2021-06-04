import React, { useEffect, useRef, useContext, useState } from 'react';
import { VirtualElement } from '@popperjs/core';
import appEvents from 'grafana/app/core/app_events';
import * as d3 from 'd3';
import * as d3hexbin from 'd3-hexbin';
import { Check } from 'types';
import { Spinner, Tooltip, useTheme2, Popover } from '@grafana/ui';
import { SuccessRateContext, SuccessRateTypes } from 'contexts/SuccessRateContext';
import { getHexFillColor, getLayout, getMouseXY } from './checksVizUtils';
import { dashboardUID, checkType as getCheckType } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppEvents } from '@grafana/data';
import { getLocationSrv } from '@grafana/runtime';
import { usePopper } from 'react-popper';
import { SuccessRateGauge } from 'components/SuccessRateGauge';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';

interface Props {
  checks: Check[];
}

export function ChecksVisualization({ checks }: Props) {
  const svgEl = useRef<SVGSVGElement>(null);
  const theme = useTheme2();
  const { values, loading } = useContext(SuccessRateContext);
  const [virtualElement, setVirtualElement] = useState<VirtualElement>({
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      top: -100,
      right: 0,
      bottom: 0,
      left: -100,
    }),
  });
  // const [showTooltip, setShowTooltip] = useState(false);
  const [popperElement, setPopperElement] = useState<HTMLElement>(null);
  const [hoveredCheck, setHoveredCheck] = useState<Check>();
  const { instance } = useContext(InstanceContext);
  const { styles, attributes } = usePopper(virtualElement, popperElement);

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
      })
      .style('cursor', 'pointer')
      .on('mousemove', () => {
        let { xpos, ypos } = getMouseXY();
        setVirtualElement({
          getBoundingClientRect: () => ({
            width: 0,
            height: 0,
            top: ypos,
            bottom: ypos,
            left: xpos,
            right: xpos,
          }),
        });
        // tooltip.style('left', xpos + 'px').style('top', ypos + 'px');
      })
      .on('mouseover', (d, index) => {
        // setShowTooltip(true);
        //@ts-ignore the type definitions aren't correct here
        setHoveredCheck(checks[index]);
      })
      .on('mouseout', () => {
        // setShowTooltip(false);
        setHoveredCheck(undefined);
        setVirtualElement({
          getBoundingClientRect: () => ({
            width: 0,
            height: 0,
            top: -100,
            right: 0,
            bottom: 0,
            left: -100,
          }),
        });
      })
      .on('click', (d, index) => {
        //@ts-ignore the type definitions aren't correct here
        const check = checks[index];
        const checkType = getCheckType(check.settings);
        const target = dashboardUID(checkType, instance.api);

        if (!target) {
          appEvents.emit(AppEvents.alertError, ['Dashboard not found']);
          return;
        }

        getLocationSrv().update({
          partial: false,
          path: `/d/${target.uid}`,
          query: {
            'var-instance': check.target,
            'var-job': check.job,
          },
        });
      });
    // .on('mouseover', () => {
    //   console.log('mosing over');
    //   setShowTooltip(true);
    // });
    // .on('mouseout', () => setShowTooltip(false));
  }, [checks, values, theme, svgEl, loading, instance.api]);

  // TODO: adding a loading state prevents the ref from getting set on mount. Use a callback ref?
  // if (loading) {
  //   return <Spinner />;
  // }

  // render svg element and use ref callback to store reference
  return (
    <div>
      {loading ? <Spinner /> : null}
      <svg ref={svgEl} />
      <div ref={setPopperElement} style={styles.popper} {...attributes.popper} className="popper__background">
        <h2>{hoveredCheck?.job}</h2>
        <h2>{hoveredCheck?.target}</h2>
        <SuccessRateGauge
          type={SuccessRateTypes.Checks}
          id={hoveredCheck?.id ?? 0}
          height={100}
          width={100}
          labelNames={[]}
          labelValues={[]}
          sparkline={false}
        />
      </div>
    </div>
  );
}
