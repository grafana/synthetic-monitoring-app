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
  }, [query, instance?.api, options]);

  return { loading: isFetchingData, data, error };
}
