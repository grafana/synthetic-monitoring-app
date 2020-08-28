import { useContext, useState, useEffect } from 'react';
import { InstanceContext } from 'components/InstanceContext';
import { queryMetric } from 'utils';

export function useMetricData(query: string) {
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
      const { error: queryError, data: queryData } = await queryMetric(url, query);
      setData(queryData);
      setError(queryError);
      setIsFetchingData(false);
    };
    getData();
  }, [query, instance?.api]);

  return { loading: isFetchingData, data, error };
}
