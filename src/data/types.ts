import { FaroEventMeta } from 'faro';

export type MutationProps<T = unknown> = {
  eventInfo?: FaroEventMeta['info'];
  onSuccess?: (res: T) => void;
  onError?: (err: unknown) => void;
};
