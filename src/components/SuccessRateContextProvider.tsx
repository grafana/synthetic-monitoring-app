import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Check, Probe } from 'types';
import { queryMetric } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { SuccessRates, SuccessRateContext, SuccessRateTypes, SuccessRate } from 'contexts/SuccessRateContext';

interface Props {
  checks?: Check[];
  probes?: Probe[];
}

const values: SuccessRates = {
  checks: {},
  probes: {},
};

type SeedRequestMetric = {
  instance: string;
  job: string;
  probe: string;
};

type SeedRequestValue = [number, string];

type SeedRequestItem = {
  metric: SeedRequestMetric;
  value: SeedRequestValue;
};

type SeedRequestResponse = SeedRequestItem[];

const parseCheckResults = (checks: Check[] | undefined, data: any) => {
  if (!checks) {
    return;
  }

  const response = data as SeedRequestResponse;
  const resultsPerCheck = checks.reduce<SuccessRate>((acc, check) => {
    if (!check.id) {
      return acc;
    }
    acc[check.id] = undefined;
    return acc;
  }, {});

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

  return resultsPerCheck;
};

const parseProbeResults = (probes: Probe[] | undefined, data: any) => {
  if (!probes) {
    return {};
  }

  const response = data as SeedRequestResponse;
  const resultsPerCheck = probes.reduce<SuccessRate>((acc, probe) => {
    if (!probe.id) {
      return acc;
    }
    acc[probe.id] = undefined;
    return acc;
  }, {});

  response.forEach((item) => {
    const check = probes?.find((probe) => probe.name === item.metric.probe);
    if (check && check.id) {
      const returnedValue = item.value?.[1];
      if (returnedValue !== undefined) {
        const float = parseFloat(returnedValue);
        resultsPerCheck[check.id] = float;
      }
    }
  });

  return resultsPerCheck;
};

export function SuccessRateContextProvider({ checks, probes, children }: PropsWithChildren<Props>) {
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
      const checkUptimeQuery =
        'sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)';
      const probeUptimeQuery =
        'sum(rate(probe_all_success_sum[3h])) by (probe) / sum(rate(probe_all_success_count[3h])) by (probe)';

      const successRateType = checks ? SuccessRateTypes.Checks : SuccessRateTypes.Probes;

      const uptimeQuery = successRateType === SuccessRateTypes.Checks ? checkUptimeQuery : probeUptimeQuery;

      const url = instance?.api?.getMetricsDS()?.url;

      if (
        !url ||
        (successRateType === SuccessRateTypes.Checks && !checks?.length) ||
        (successRateType === SuccessRateTypes.Probes && !probes?.length)
      ) {
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

      const resultsByType =
        successRateType === SuccessRateTypes.Checks ? parseCheckResults(checks, data) : parseProbeResults(probes, data);

      if (error || !data) {
        setLoading(false);
        return;
      }

      setSuccessRate((state) => ({
        ...state,
        [successRateType]: resultsByType,
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
  }, [checks, instance.api, probes]);

  return (
    <SuccessRateContext.Provider value={{ values: successRateValues, loading, updateSuccessRate }}>
      {children}
    </SuccessRateContext.Provider>
  );
}
