import { useMeta } from './useMeta';
import { useSMDS } from './useSMDS';

// todo: is this needed?
export function useInitialised() {
  const meta = useMeta();
  const smDS = useSMDS();

  return meta.enabled && smDS;
}
