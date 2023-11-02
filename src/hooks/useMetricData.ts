import { useContext, useEffect,useState } from 'react';

import { MetricQueryOptions,queryMetric } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';

interface UseMetricOptions {
  skip?: boolean;
}

const REFETCH_INTERVAL = 60000;

export function useMetricData(query: string, options?: MetricQueryOptions & UseMetricOptions) {
  const { instance } = useContext(InstanceContext);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | undefined>();

  // refresh data every 60 seconds
  useEffect(() => {
    const getData = async () => {
      const url = instance.api?.getMetricsDS()?.url;
      if (options?.skip || !url) {
        return;
      }
      setIsFetchingData(true);
      const { error: queryError, data: queryData } = await queryMetric(url, query, options);

      setData(queryData);
      setError(queryError);
      setIsFetchingData(false);
    };

    getData();

    const interval = setInterval(() => {
      getData();
    }, REFETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [query, instance.api, options]);

  return { loading: isFetchingData, data, error };
}
