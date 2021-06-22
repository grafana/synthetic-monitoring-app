import { Icon } from '@grafana/ui';
import { SuccessRateContext } from 'contexts/SuccessRateContext';
import React, { useContext } from 'react';
import { Check } from 'types';

interface Props {
  width: number;
  height: number;
  hexRadius: number;
  hexCenters: Array<[number, number]>;
  checks: Check[];
}

export const IconOverlay = ({ width, height, hexCenters, hexRadius, checks }: Props) => {
  const { values: successRates } = useContext(SuccessRateContext);
  return (
    <div
      style={{
        width,
        position: 'absolute',
        pointerEvents: 'none',
        height,
      }}
    >
      {hexCenters.map(([x, y], index) => {
        return (
          <Icon
            key={index}
            name={successRates.checks?.[checks[index]?.id ?? 0]?.icon}
            style={{
              position: 'absolute',
              left: x + hexRadius - 7, // Subtract 7 because it's half the width of the icon element
              top: y + hexRadius - 7, // Subtract 7 because it's half the width of the icon element
            }}
          />
        );
      })}
    </div>
  );
};
