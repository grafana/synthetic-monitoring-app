import React, { useRef, useState, useCallback, useContext } from 'react';
import { VirtualElement } from '@popperjs/core';
import * as d3hexbin from 'd3-hexbin';
import { Check } from 'types';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { SuccessRateContext, SuccessRateTypes } from 'contexts/SuccessRateContext';
import { getLayout } from './checksVizUtils';
import { GrafanaTheme2 } from '@grafana/data';
import { usePopper } from 'react-popper';
import { SuccessRateGauge } from 'components/SuccessRateGauge';
import { Hexagon } from './Hexagon';
import { Autosizer } from 'components/Autosizer';
import { IconOverlay } from './IconOverlay';

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
    pointer-events: none;
    padding: ${theme.spacing(2)};
    border-radius: 3px;
  `,
  hidden: css`
    display: none;
  `,
});

export function ChecksVisualization({ checks }: Props) {
  const { values: successRates } = useContext(SuccessRateContext);
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
  const { styles: popperStyles, attributes } = usePopper(virtualElement, popperElement.current, {
    placement: 'right-start',
    modifiers: [
      { name: 'offset', options: { offset: [10, 20] } },
      { name: 'preventOverflow', enabled: true, options: { rootBoundary: 'viewport' } },
    ],
  });

  const updateTooltipLocation = useCallback((e: React.MouseEvent<Element>, check: Check) => {
    setHoveredCheck(check);

    setVirtualElement({
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        top: e.clientY,
        bottom: e.clientY,
        left: e.clientX,
        right: e.clientX,
      }),
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTimeout(() => {
      setHoveredCheck((state) => {
        if (state === hoveredCheck) {
          return undefined;
        }
        return state;
      });
    }, 25);
  }, [hoveredCheck]);

  return (
    <>
      <Autosizer>
        {({ width }) => {
          // Use d3 to do layout math
          const { hexRadius, hexCenters, height, svgWidth } = getLayout(checks.length, width);
          const hexbin = d3hexbin.hexbin().radius(hexRadius);
          const hexbins = hexbin(hexCenters);
          const adjustedHeight = height + hexRadius * 2;

          return (
            <>
              <svg width={svgWidth} height={adjustedHeight}>
                <g transform={`translate(${hexRadius + 1}, ${hexRadius + 1})`}>
                  {hexbins.map((hex, index) => (
                    <Hexagon
                      key={index}
                      hexPath={hex}
                      hexRadius={hexRadius}
                      onMouseMove={updateTooltipLocation}
                      onMouseOut={hideTooltip}
                      check={checks[index]}
                    />
                  ))}
                </g>
              </svg>
              <IconOverlay
                width={svgWidth}
                height={adjustedHeight}
                hexCenters={hexCenters}
                hexRadius={hexRadius}
                checks={checks}
              />
            </>
          );
        }}
      </Autosizer>
      <div
        ref={popperElement}
        style={popperStyles.popper}
        data-testid="check-viz-tooltip"
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
    </>
  );
}
