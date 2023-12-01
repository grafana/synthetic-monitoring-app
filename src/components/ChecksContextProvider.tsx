import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';

import { Check } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';

interface Props {}

export function ChecksContextProvider({ children }: PropsWithChildren<Props>) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchChecks, setFetchChecks] = useState(true);
  const { instance } = useContext(InstanceContext);

  useEffect(() => {
    if (!fetchChecks) {
      return;
    }
    setLoading(true);
    instance.api?.listChecks().then((checks) => {
      setChecks(checks);
      setLoading(false);
      setFetchChecks(false);
    });
  }, [instance.api, fetchChecks]);

  const refetchChecks = () => setFetchChecks(true);

  return <ChecksContext.Provider value={{ checks, loading, refetchChecks }}>{children}</ChecksContext.Provider>;
}
