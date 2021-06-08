import React, { useRef, useState } from 'react';
import { VirtualElement } from '@popperjs/core';
import * as d3hexbin from 'd3-hexbin';
import { Check } from 'types';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { SuccessRateTypes } from 'contexts/SuccessRateContext';
import { getLayout } from './checksVizUtils';
import { GrafanaTheme2 } from '@grafana/data';
import { usePopper } from 'react-popper';
import { SuccessRateGauge } from 'components/SuccessRateGauge';
import { Hexagon } from './Hexagon';

interface Props {
  checks: Check[];
}

const getStyles = (theme: GrafanaTheme2) => ({
  successGaugeContainer: css`
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  tooltipContainer: css`
    padding: ${theme.spacing(2)};
  `,
  hidden: css`
    display: none;
  `,
});

export function ChecksVisualization({ checks }: Props) {
  const styles = useStyles2(getStyles);
  const popperElement = useRef<HTMLDivElement>(null);
  const [hoveredCheck, setHoveredCheck] = useState<Check>();
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
  const { styles: popperStyles, attributes } = usePopper(virtualElement, popperElement.current, {});

  // Use d3 to do layout math
  const { hexRadius, hexCenters, width, height } = getLayout(checks.length);
  const hexbin = d3hexbin.hexbin().radius(hexRadius);
  const hexbins = hexbin(hexCenters);

  const updateTooltipLocation = (e: React.MouseEvent, check: Check) => {
    setHoveredCheck(check);
    setVirtualElement({
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        top: e.clientY + 5,
        bottom: e.clientY + 5,
        left: e.clientX,
        right: e.clientX,
      }),
    });
  };

  const hideTooltip = () => {
    setHoveredCheck(undefined);
  };

  return (
    <div>
      <svg width={width + hexRadius * 2} height={height + hexRadius * 2}>
        <g transform={`translate(${hexRadius + 1}, ${hexRadius + 1})`}>
          {hexbins.map((hex, index) => (
            <Hexagon
              key={checks[index].id ?? index}
              hexPath={hex}
              hexRadius={hexRadius}
              onMouseMove={updateTooltipLocation}
              onMouseOut={hideTooltip}
              check={checks[index]}
            />
          ))}
        </g>
      </svg>
      <div
        ref={popperElement}
        style={popperStyles.popper}
        {...attributes.popper}
        className={cx('popper__background', styles.tooltipContainer, { [styles.hidden]: !hoveredCheck })}
      >
        <h3>{hoveredCheck?.job}</h3>
        <div>{hoveredCheck?.target}</div>
        <div className={styles.successGaugeContainer}>
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
    </div>
  );
}
