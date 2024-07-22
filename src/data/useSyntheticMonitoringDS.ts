import { useDatasource } from 'contexts/DatasourceContextProvider';

export function useSyntheticMonitoringDS() {
  const { smDS } = useDatasource();

  return smDS;
}
