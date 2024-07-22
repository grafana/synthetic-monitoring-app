import { useSMDatasourceContext } from 'contexts/SMDatasourceContext';

export function useSMDS() {
  const { smDS } = useSMDatasourceContext();

  return smDS;
}
