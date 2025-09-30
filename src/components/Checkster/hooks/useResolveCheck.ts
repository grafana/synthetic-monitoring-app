import { useEffect, useState } from 'react';

import { Check } from 'types';

interface ResolvedCheck {
  check: Check | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

export function useResolveCheck(check: Check | Promise<Check> | undefined): ResolvedCheck {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resolvedCheck, setResolvedCheck] = useState<Check | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (check instanceof Promise) {
      setIsLoading(true);
      check
        .then((entity) => {
          setResolvedCheck(entity);
          setIsLoading(false);
        })
        .catch(setError)
        .finally(() => setIsLoading(false));
    } else {
      setResolvedCheck(check);
    }
  }, [check]);

  return { check: resolvedCheck, isLoading, error };
}
