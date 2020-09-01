import { useContext, useState, useEffect } from 'react';
import { InstanceContext } from 'components/InstanceContext';
import { queryMetric, MetricQueryOptions } from 'utils';

interface UseMetricOptions {
  skip?: boolean;
}

export function useMetricData(query: string, options?: (MetricQueryOptions & UseMetricOptions) | undefined) {
  const { instance } = useContext(InstanceContext);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [refetches, setRefetches] = useState(0);

  // refresh data every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefetches(refetches + 1);
    }, 60000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    const getData = async () => {
      setIsFetchingData(true);
      const url = instance?.api?.getMetricsDS()?.url;
      if (!url) {
        return;
      }
      const { error: queryError, data: queryData } = await queryMetric(url, query, options);
      setData(queryData);
      setError(queryError);
      setIsFetchingData(false);
    };
    if (!options?.skip) {
      getData();
    }
  }, [query, instance?.api, options, refetches]);

  return { loading: isFetchingData, data, error };
}
