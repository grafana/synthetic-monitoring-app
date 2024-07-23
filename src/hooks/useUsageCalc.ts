import { calculateMultiHTTPUsage, calculateUsage } from 'checkUsageCalc';

import { CalculateUsageValues, CheckType, UsageValues } from 'types';
import { AccountingClassNames } from 'datasource/types';
import { useCheckInfo } from 'data/useCheckInfo';

export const getAccountingClass = (calcUsageValue: CalculateUsageValues): AccountingClassNames => {
  const { basicMetricsOnly, checkType, isSSL } = calcUsageValue;
  let accountClass: keyof typeof AccountingClassNames = checkType;

  if ((checkType === CheckType.HTTP || checkType === CheckType.TCP || checkType === CheckType.GRPC) && isSSL) {
    accountClass = `${checkType}_ssl`;
  }

  if (basicMetricsOnly) {
    accountClass = `${accountClass}_basic`;
  }

  return AccountingClassNames[accountClass];
};

const calcFunctionMap = {
  multi: calculateMultiHTTPUsage,
  other: calculateUsage,
};

export function useUsageCalc(calcUsageValues: CalculateUsageValues[]) {
  const { data, isLoading } = useCheckInfo();

  if (isLoading || !data || !calcUsageValues.length) {
    return;
  }

  return calcUsageValues.reduce<UsageValues>(
    (total, calcUsageValue) => {
      const accountingClass = getAccountingClass(calcUsageValue);
      const { assertionCount, probeCount, frequencySeconds } = calcUsageValue;
      const calculateFunc = calcFunctionMap[calcUsageValue.checkType === CheckType.MULTI_HTTP ? `multi` : `other`];

      const usage = calculateFunc({
        assertionCount,
        probeCount,
        frequencySeconds,
        seriesPerProbe: data.AccountingClasses[accountingClass]?.Series,
      });

      return {
        activeSeries: total.activeSeries + usage.activeSeries,
        logsGbPerMonth: total.logsGbPerMonth + usage.logsGbPerMonth,
        checksPerMonth: total.checksPerMonth + usage.checksPerMonth,
        dpm: total.dpm + usage.dpm,
      };
    },
    { logsGbPerMonth: 0, activeSeries: 0, checksPerMonth: 0, dpm: 0 }
  );
}
