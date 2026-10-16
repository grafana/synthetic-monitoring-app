import React from 'react';
import { Text } from '@grafana/ui';
import pluralize from 'pluralize';

import { formatDuration } from 'utils';

interface AlertEvaluationInfoProps {
  testExecutionsPerPeriod: number;
  checkFrequency: number;
  probesNumber: number;
  period: string;
}

export const AlertEvaluationInfo = ({
  testExecutionsPerPeriod,
  checkFrequency,
  probesNumber,
  period,
}: AlertEvaluationInfoProps) => (
  <Text variant="bodySmall">
    {testExecutionsPerPeriod} {pluralize('execution', testExecutionsPerPeriod)} across {probesNumber}{' '}
    {pluralize('probe', probesNumber)}, running every {formatDuration(checkFrequency)} over {period}.
  </Text>
);
