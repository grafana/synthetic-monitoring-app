import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';

import { Check } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';

interface Props {}

export function ChecksContextProvider({ children }: PropsWithChildren<Props>) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const { instance } = useContext(InstanceContext);

  useEffect(() => {
    setLoading(true);
    instance.api?.listChecks().then((checks) => {
      setChecks(checks);
      setLoading(false);
    });
  }, [instance.api]);

  return <ChecksContext.Provider value={{ checks, loading }}>{children}</ChecksContext.Provider>;
}
