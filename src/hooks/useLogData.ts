import { DateTime } from '@grafana/data';
import { InstanceContext } from 'contexts/InstanceContext';
import { useContext, useEffect, useState } from 'react';
import { queryLogsLegacy } from 'utils';

interface UseLogOptions {
  start: DateTime;
  end: DateTime;
  skip: boolean;
}

const REFETCH_INTERVAL = 10000;

export function useLogData(query: string, options: UseLogOptions) {
  const { instance } = useContext(InstanceContext);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | undefined>();
  const start = options.start.unix();
  const end = options.end.unix();

  // refresh data every 3 seconds
  useEffect(() => {
    const getData = async () => {
      const url = instance.api?.getLogsDS()?.url;
      if (!url) {
        return;
      }
      setIsFetchingData(true);
      const { error: queryError, data: queryData } = await queryLogsLegacy(url, query, start, end);

      setData(queryData);
      setError(queryError);
      setIsFetchingData(false);
    };

    if (options.skip) {
      return;
    }

    getData();

    const interval = setInterval(() => {
      getData();
    }, REFETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [query, instance.api, options.skip, start, end]);

  return {
    loading: isFetchingData,
    data,
    error,
  };
}
