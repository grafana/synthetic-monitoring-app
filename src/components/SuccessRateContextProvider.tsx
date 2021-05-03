import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Check } from 'types';
import { queryMetric } from 'utils';
import { InstanceContext } from './InstanceContext';
import { SuccessRates, SuccessRateContext, SuccessRateTypes } from './SuccessRateContext';

interface Props {
  checks: Check[];
}

const values: SuccessRates = {
  checks: {},
  probes: {},
};

type SeedRequestMetric = {
  instance: string;
  job: string;
};

type SeedRequestValue = [number, string];

type SeedRequestItem = {
  metric: SeedRequestMetric;
  value: SeedRequestValue;
};

type SeedRequestResponse = SeedRequestItem[];

export function SuccessRateContextProvider({ checks, children }: PropsWithChildren<Props>) {
  const { instance } = useContext(InstanceContext);
  const [successRateValues, setSuccessRate] = useState<SuccessRates>(values);

  const updateSuccessRate = (type: SuccessRateTypes, id: number | undefined, successRate: number | undefined) => {
    if (!id) {
      return;
    }

    setSuccessRate((state) => ({
      ...state,
      [type]: {
        ...state[type],
        [id]: successRate,
      },
    }));
  };

  useEffect(() => {
    const seedSuccessRates = async () => {
      const uptimeQuery = `sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)`;
      const url = instance?.api?.getMetricsDS()?.url;
      if (!url) {
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      const start = now - 60 * 60 * 3;
      const options = {
        start,
        end: now,
        step: 0,
      };
      const { error, data } = await queryMetric(url, uptimeQuery, options);

      if (error || !data) {
        return;
      }

      (data as SeedRequestResponse).forEach((item) => {
        const check = checks?.find((check) => check.job === item.metric.job && check.target === item.metric.instance);
        if (check) {
          const returnedValue = item.value?.[1];
          if (returnedValue !== undefined) {
            const float = parseFloat(returnedValue);
            updateSuccessRate(SuccessRateTypes.Checks, check.id, float);
          }
        }
      });
    };

    seedSuccessRates();
  }, [checks, instance.api]);

  return (
    <SuccessRateContext.Provider value={{ values: successRateValues, updateSuccessRate }}>
      {children}
    </SuccessRateContext.Provider>
  );
}
