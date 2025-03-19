import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PopoverContent, Text, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import pluralize from 'pluralize';

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
  const tooltipData = [
    {
      label: 'frequency',
      content: `${checkFrequency}s`,
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
      {`This alert will evaluate against a total of ${testExecutionsPerPeriod} ${pluralize(
        'execution',
        testExecutionsPerPeriod
      )} based on your current settings for `}
      {tooltipData.map((tooltip, index) => (
        <React.Fragment key={tooltip.label}>
          <TooltipWrapper content={tooltip.content}>{tooltip.label}</TooltipWrapper>
          {index < tooltipData.length - 1 && `, `}
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
