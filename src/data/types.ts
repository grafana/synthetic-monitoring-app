export type MutationProps<T> = {
  onSuccess?: (res: T) => void;
  onError?: (err: unknown) => void;
};
