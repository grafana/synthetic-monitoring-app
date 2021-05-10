import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Check } from 'types';
import { queryMetric } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { SuccessRates, SuccessRateContext, SuccessRateTypes, SuccessRate } from 'contexts/SuccessRateContext';

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
  const [loading, setLoading] = useState(true);

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
    const getSuccessRates = async () => {
      setLoading(true);
      const uptimeQuery = `sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)`;
      const url = instance?.api?.getMetricsDS()?.url;
      if (!url || !checks.length) {
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
        setLoading(false);
        return;
      }

      const resultsPerCheck = checks.reduce<SuccessRate>((acc, check) => {
        if (!check.id) {
          return acc;
        }
        acc[check.id] = undefined;
        return acc;
      }, {});

      const response = data as SeedRequestResponse;

      response.forEach((item) => {
        const check = checks?.find((check) => check.job === item.metric.job && check.target === item.metric.instance);
        if (check && check.id) {
          const returnedValue = item.value?.[1];
          if (returnedValue !== undefined) {
            const float = parseFloat(returnedValue);
            resultsPerCheck[check.id] = float;
          }
        }
      });

      setSuccessRate((state) => ({
        ...state,
        [SuccessRateTypes.Checks]: resultsPerCheck,
      }));
      setLoading(false);
    };

    // Fetch on initial load
    getSuccessRates();
    // Refresh data every 60 seconds
    const interval = setInterval(() => {
      getSuccessRates();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [checks, instance.api]);

  return (
    <SuccessRateContext.Provider value={{ values: successRateValues, loading, updateSuccessRate }}>
      {children}
    </SuccessRateContext.Provider>
  );
}
