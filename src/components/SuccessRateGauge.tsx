import React, { useContext } from 'react';
import { BigValueColorMode, BigValueGraphMode, BigValue, Container } from '@grafana/ui';
import { DisplayValue } from '@grafana/data';
import { config } from '@grafana/runtime';
import { SuccessRateContext, SuccessRateTypes, SuccessRateValue, ThresholdSettings } from 'contexts/SuccessRateContext';
import { getSuccessRateThresholdColor } from 'utils';
import { BigValueTitle } from 'components/BigValueTitle';
import { REACHABILITY_DESCRIPTION, UPTIME_DESCRIPTION } from './constants';

interface Props {
  title: 'Reachability' | 'Uptime';
  type: SuccessRateTypes;
  id: number;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const getDisplayValue = (
  title: 'Reachability' | 'Uptime',
  successRate: SuccessRateValue,
  loading: boolean,
  thresholds: ThresholdSettings
): DisplayValue => {
  if (loading) {
    return {
      numeric: 0,
      title,
      text: 'loading...',
    };
  }

  // Could do this better by not checking strings
  const successRateKey = title === 'Reachability' ? successRate.reachabilityValue : successRate.uptimeValue;
  const displayValueKey =
    title === 'Reachability' ? successRate.reachabilityDisplayValue : successRate.uptimeDisplayValue;
  const thresholdKey: any = title.toLowerCase();

  // Pick color based on tenant threshold settings
  const color = getSuccessRateThresholdColor(thresholds, thresholdKey, successRateKey!);
  const infoText = title === 'Reachability' ? REACHABILITY_DESCRIPTION : UPTIME_DESCRIPTION;

  return {
    // @ts-ignore The BigValue component only allows strings for a title, but we're looking to pass in a component.
    // There's nothing technically stopping us from this, but it is a hack
    title: <BigValueTitle title={title} infoText={infoText} />,
    color: color,
    numeric: successRateKey || 0,
    text: successRate.noData ? 'N/A' : displayValueKey!,
  };
};

export const SuccessRateGauge = ({ title, type, id, height, width, onClick }: Props) => {
  const { values, loading, thresholds } = useContext(SuccessRateContext);

  const value = getDisplayValue(title, values[type]?.[id] ?? values.defaults, loading, thresholds);
  return (
    <Container>
      <BigValue
        theme={config.theme2}
        colorMode={BigValueColorMode.Value}
        height={height}
        width={width}
        graphMode={BigValueGraphMode.Area}
        value={value}
        onClick={onClick}
      />
    </Container>
  );
};
