import { useMetaContext } from 'contexts/MetaContext';

export function useMeta() {
  const { meta } = useMetaContext();

  return meta;
}
