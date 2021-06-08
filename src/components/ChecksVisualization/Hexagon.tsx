import { SuccessRateContext } from 'contexts/SuccessRateContext';
import React, { useContext } from 'react';
import * as d3hexbin from 'd3-hexbin';
import { Check } from 'types';
import { getHexFillColor } from './checksVizUtils';
import { getLocationSrv } from '@grafana/runtime';
import appEvents from 'grafana/app/core/app_events';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, AppEvents } from '@grafana/data';
import { css } from '@emotion/css';
import { checkType as getCheckType, dashboardUID } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';

interface Props {
  onMouseOver: (e: React.MouseEvent, check: Check) => void;
  onMouseOut: (e: React.MouseEvent) => void;
  check: Check;
  hexPath: d3hexbin.HexbinBin<[number, number]>;
  hexRadius: number;
}

const getStyles = (theme: GrafanaTheme2) => ({
  hexagon: css`
    stroke: ${theme.colors.getContrastText(theme.colors.background.secondary)};
    stroke-width: 1;
    cursor: pointer;
  `,
});

export const Hexagon = ({ onMouseOver, onMouseOut, check, hexPath, hexRadius }: Props) => {
  const { values } = useContext(SuccessRateContext);
  const { instance } = useContext(InstanceContext);
  const hexbin = d3hexbin.hexbin().radius(hexRadius);
  const styles = useStyles2(getStyles);

  const navigateToDashboard = () => {
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
  };

  return (
    <path
      className={styles.hexagon}
      d={`M${hexPath.x},${hexPath.y}${hexbin.hexagon()}`}
      fill={getHexFillColor(check, values)}
      onMouseOver={(e) => onMouseOver(e, check)}
      onMouseOut={onMouseOut}
      onClick={() => navigateToDashboard()}
    />
  );
};
