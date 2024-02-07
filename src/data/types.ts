import { FaroEventMeta } from 'faro';

export type MutationProps<T> = {
  eventInfo?: FaroEventMeta['info'];
  onSuccess?: (res: T) => void;
  onError?: (err: unknown) => void;
};
