import { useInstances } from 'contexts/InstanceContext';

export function useMeta() {
  const { meta } = useInstances();

  return meta;
}
