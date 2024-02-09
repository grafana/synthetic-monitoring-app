import { calculateMultiHTTPUsage, calculateUsage } from 'checkUsageCalc';

import { Check, CheckType, UsageValues } from 'types';
import { checkType as getCheckType } from 'utils';
import { AccountingClassNames } from 'datasource/types';
import { useCheckInfo } from 'data/useCheckInfo';

const addSSL = (check: Partial<Check>, baseClass: CheckType) => {
  if (baseClass === CheckType.HTTP) {
    if (check.settings?.http?.tlsConfig && Object.keys(check.settings.http.tlsConfig).length > 0) {
      return `${baseClass}_ssl`;
    }
  }

  if (baseClass === CheckType.TCP) {
    if (check.settings?.tcp?.tlsConfig && Object.keys(check.settings.tcp.tlsConfig).length > 0) {
      return `${baseClass}_ssl`;
    }
  }

  return baseClass;
};

export const getAccountingClass = (check: Partial<Check>): AccountingClassNames | undefined => {
  if (!check.settings) {
    return;
  }

  const baseClass = getCheckType(check.settings);
  const withSSL = addSSL(check, baseClass);

  const withBasic = check.basicMetricsOnly ? `${withSSL}_basic` : withSSL;

  return AccountingClassNames[withBasic as keyof typeof AccountingClassNames];
};

export function useUsageCalc(checks?: Partial<Check> | Check[]) {
  const { data, isLoading } = useCheckInfo();

  if (isLoading || !data || !checks) {
    return;
  }

  // Calculating usage for multiple checks at once
  if (Array.isArray(checks)) {
    return checks.reduce<UsageValues>(
      (total, check) => {
        const accountingClass = getAccountingClass(check);
        if (!accountingClass) {
          return total;
        }
        const usage = calculateUsage({
          probeCount: check.probes.length,
          frequencySeconds: check.frequency / 1000,
          seriesPerCheck: data.AccountingClasses[accountingClass].Series,
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

  // In this case, we're just calculating for an individual check
  if (!checks.settings) {
    return;
  }

  const accountingClass = getAccountingClass(checks);

  if (!accountingClass) {
    return;
  }

  const seriesPerCheck = data.AccountingClasses[accountingClass]?.Series;
  if (accountingClass === AccountingClassNames.multihttp_basic) {
    return calculateMultiHTTPUsage(checks);
  }
  if (seriesPerCheck === undefined) {
    return;
  }

  return calculateUsage({
    probeCount: checks.probes?.length ?? 0,
    frequencySeconds: (checks.frequency ?? 0) / 1000,
    seriesPerCheck: data.AccountingClasses[accountingClass].Series,
  });
}
