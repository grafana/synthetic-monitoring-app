import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Check, Probe } from 'types';
import { queryMetric } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import {
  SuccessRates,
  SuccessRateContext,
  SuccessRateTypes,
  SuccessRate,
  defaultValues,
  ThresholdSettings,
  defaultThresholds,
} from 'contexts/SuccessRateContext';

interface Props {
  checks?: Check[];
  probes?: Probe[];
}

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

type KeyedValueData = {
  [key: string]: string;
};

const keyDataByCheckId = (checks: Check[], data: SeedRequestResponse): KeyedValueData => {
  const keyedData = checks.reduce((acc, check) => {
    const valueForCheck = data.find((item) => check.job === item.metric.job && check.target === item.metric.instance);
    return {
      ...acc,
      [String(check.id)]: valueForCheck?.value[1],
    };
  }, {});

  return keyedData;
};

const formatDigits = (value: string): number => {
  const withDefault = !value ? '0' : value;
  const number = parseFloat(withDefault) * 100;
  const fixed = parseFloat(number.toFixed(1));
  // sometimes the query results in 100.0, we need to make sure and format those
  if (fixed === 100) {
    return Math.trunc(fixed);
  }
  return fixed;
};

const parseCheckResults = (
  checks: Check[] | undefined,
  reachabilityData: SeedRequestResponse,
  uptimeData: SeedRequestResponse
) => {
  if (!checks) {
    return;
  }
  const resultsPerCheck: SuccessRate = {};

  const reachabilityValuesById = keyDataByCheckId(checks, reachabilityData);
  const uptimeValuesById = keyDataByCheckId(checks, uptimeData);

  checks.forEach((check) => {
    if (check.id) {
      // If new check and no data yet, return defaults
      if (!reachabilityValuesById[check.id] || !uptimeValuesById[check.id]) {
        resultsPerCheck[check.id] = {
          ...defaultValues.defaults,
        };
      } else {
        const reachabilityValue = formatDigits(reachabilityValuesById[check.id]);
        const uptimeValue = formatDigits(uptimeValuesById[check.id]);

        resultsPerCheck[check.id] = {
          reachabilityValue,
          reachabilityDisplayValue: `${reachabilityValue}%`,
          uptimeValue,
          uptimeDisplayValue: `${uptimeValue}%`,
        };
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
  const resultsPerProbe = probes.reduce<SuccessRate>((acc, probe) => {
    if (!probe.id) {
      return acc;
    }
    acc[probe.id] = defaultValues.defaults;
    return acc;
  }, {});

  // TODO: Re-type latency check data
  response.forEach((item) => {
    const probe = probes.find((probe) => probe.name === item.metric.probe);
    if (probe && probe.id) {
      const returnedValue = item.value?.[1];
      if (returnedValue !== undefined) {
        const float = parseFloat(returnedValue) * 100;
        resultsPerProbe[probe.id] = {
          reachabilityValue: parseFloat(float.toFixed(1)),
          reachabilityDisplayValue: float.toFixed(1),
        };
      }
    }
  });

  return resultsPerProbe;
};

export function SuccessRateContextProvider({ checks, probes, children }: PropsWithChildren<Props>) {
  const { instance } = useContext(InstanceContext);
  const [successRateValues, setSuccessRate] = useState<SuccessRates>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [thresholds, setThresholds] = useState<ThresholdSettings>(defaultThresholds);
  const [shouldUpdate, setShouldUpdate] = useState(true);

  const pauseUpdates = () => setShouldUpdate(false);
  const resumeUpdates = () => setShouldUpdate(true);

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
      // setLoading(true);
      const checkReachabilityQuery =
        'sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)';
      const probeReachabilityQuery =
        'sum(rate(probe_all_success_sum[3h])) by (probe) / sum(rate(probe_all_success_count[3h])) by (probe)';

      const checkUptimeQuery = `sum_over_time((ceil(sum by (instance, job) (increase(probe_all_success_sum[5m])) / sum by (instance, job) (increase(probe_all_success_count[5m]))))[3h:])
            / count_over_time((sum by (instance, job) (increase(probe_all_success_count[5m])))[3h:])`;

      const successRateType = checks ? SuccessRateTypes.Checks : SuccessRateTypes.Probes;

      const reachabilityQuery =
        successRateType === SuccessRateTypes.Checks ? checkReachabilityQuery : probeReachabilityQuery;

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
      const { error: reachabilityError, data: reachabilityData } = await queryMetric(url, reachabilityQuery, options);
      const { error: uptimeError, data: uptimeData } = await queryMetric(url, checkUptimeQuery, options);

      const resultsByType =
        successRateType === SuccessRateTypes.Checks
          ? parseCheckResults(checks, reachabilityData, uptimeData)
          : parseProbeResults(probes, reachabilityData);

      if (reachabilityError || uptimeError || !reachabilityData || !uptimeData) {
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
    if (shouldUpdate) {
      getSuccessRates();
    }
    // Refresh data every 60 seconds
    const interval = setInterval(() => {
      if (shouldUpdate) {
        getSuccessRates();
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [checks, instance.api, probes, shouldUpdate]);

  const updateThresholds = async () => {
    const { thresholds } = await instance.api?.getTenantSettings();
    setThresholds(thresholds);
  };

  // Call this once on first render
  useEffect(() => {
    updateThresholds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SuccessRateContext.Provider
      value={{
        values: successRateValues,
        loading,
        updateSuccessRate,
        thresholds,
        updateThresholds,
        pauseUpdates,
        resumeUpdates,
      }}
    >
      {children}
    </SuccessRateContext.Provider>
  );
}
