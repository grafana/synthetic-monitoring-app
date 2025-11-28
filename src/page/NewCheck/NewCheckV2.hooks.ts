import { useCheck } from 'data/useChecks';

export function useDuplicateCheck(duplicateId: string | null) {
  const { data, isLoading } = useCheck(Number(duplicateId));

  if (duplicateId && data) {
    return {
      check: {
        ...data,
        id: undefined,
      },
      isLoading,
    };
  }

  return {
    check: undefined,
    isLoading: duplicateId ? isLoading : false,
  };
}
