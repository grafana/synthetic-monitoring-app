import { calculateUsage } from 'checkUsageCalc';
import { CheckInfoContext } from 'contexts/CheckInfoContext';
import { AccountingClassNames } from 'datasource/types';
import { useContext } from 'react';
import { Check, CheckType } from 'types';
import { checkType as getCheckType } from 'utils';

const addSSL = (check: Partial<Check>, baseClass: CheckType) => {
  if (baseClass === CheckType.HTTP) {
    if (check.settings?.http?.tlsConfig) {
      return `${baseClass}_ssl`;
    }
  }

  if (baseClass === CheckType.TCP) {
    if (check.settings?.tcp?.tlsConfig) {
      return `${baseClass}_ssl`;
    }
  }

  return baseClass;
};

const getAccountingClass = (check: Partial<Check>): AccountingClassNames | undefined => {
  if (!check.settings) {
    return;
  }

  const baseClass = getCheckType(check.settings);
  const withSSL = addSSL(check, baseClass);

  const withBasic = check.basicMetricsOnly ? `${withSSL}_basic` : withSSL;

  return AccountingClassNames[withBasic as keyof typeof AccountingClassNames];
};

export function useUsageCalc(check?: Partial<Check>) {
  const { loading, checkInfo } = useContext(CheckInfoContext);

  if (loading || !checkInfo || !check || !check.settings) {
    return;
  }

  const accountingClass = getAccountingClass(check);

  if (!accountingClass) {
    return;
  }

  const seriesPerCheck = checkInfo.AccountingClasses[accountingClass]?.Series;
  if (seriesPerCheck === undefined) {
    return;
  }

  return calculateUsage({
    probeCount: check.probes?.length ?? 0,
    frequencySeconds: (check.frequency ?? 0) / 1000,
    seriesPerCheck: checkInfo.AccountingClasses[accountingClass].Series,
  });
}
