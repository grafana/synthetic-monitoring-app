import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PopoverContent, Text, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import pluralize from 'pluralize';

import { formatDuration } from 'utils';

interface TooltipWrapperProps {
  content: PopoverContent;
}

const TooltipWrapper: React.FC<React.PropsWithChildren<TooltipWrapperProps>> = ({ content, children }) => {
  const styles = useStyles2(getStyles);

  return (
    <Tooltip content={content} interactive={true}>
      <strong className={styles.tooltipText}>{children}</strong>
    </Tooltip>
  );
};

interface AlertEvaluationInfoProps {
  testExecutionsPerPeriod: number;
  checkFrequency: number;
  probesNumber: number;
  period: string;
}

export const AlertEvaluationInfo: React.FC<AlertEvaluationInfoProps> = ({
  testExecutionsPerPeriod,
  checkFrequency,
  probesNumber,
  period,
}) => {
  const frequency = formatDuration(checkFrequency);
  const tooltipData = [
    {
      label: `frequency`,
      content: frequency,
    },
    {
      label: 'probes',
      content: `${probesNumber} ${pluralize('probe', probesNumber)} selected`,
    },
    {
      label: 'period',
      content: period,
    },
  ];

  return (
    <Text variant="bodySmall" color="warning">
      {`This alert will evaluate against a total of [${testExecutionsPerPeriod}] ${pluralize(
        'execution',
        testExecutionsPerPeriod
      )} based on your current settings: `}
      {tooltipData.map((tooltip, index) => (
        <React.Fragment key={tooltip.label}>
          <TooltipWrapper content={tooltip.content}>{tooltip.label}</TooltipWrapper>
          {index < tooltipData.length - 2 && `, `}
          {index === tooltipData.length - 2 && `, and `}
        </React.Fragment>
      ))}
      {`.`}
    </Text>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  tooltipText: css({
    textDecoration: 'underline',
  }),
});
