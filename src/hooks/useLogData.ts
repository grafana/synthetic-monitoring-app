import { useEffect, useState } from 'react';
import { DateTime } from '@grafana/data';

import { queryLogsLegacy } from 'utils';

import { useSMDS } from './useSMDS';

interface UseLogOptions {
  start: DateTime;
  end?: DateTime;
  skip: boolean;
}

const REFETCH_INTERVAL = 10000;

export function useLogData(query: string, options: UseLogOptions) {
  const smDS = useSMDS();
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | undefined>();
  const start = options.start.unix();
  const end = options.end?.unix();

  // refresh data every 3 seconds
  useEffect(() => {
    const getData = async () => {
      const url = smDS.getLogsDS()?.url;
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
  }, [query, smDS, options.skip, start, end]);

  return {
    loading: isFetchingData,
    data,
    error,
  };
}
