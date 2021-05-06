import { InstanceContext } from 'contexts/InstanceContext';
import { CheckInfoContext } from 'contexts/CheckInfoContext';
import React, { useContext, useState, useEffect, PropsWithChildren } from 'react';
import { CheckInfo } from 'datasource/types';

interface Props {}

export function CheckInfoContextProvider({ children }: PropsWithChildren<Props>) {
  const [checkInfo, setCheckInfo] = useState<CheckInfo | undefined>();
  const [loading, setLoading] = useState(true);
  const { instance } = useContext(InstanceContext);

  useEffect(() => {
    setLoading(true);
    instance.api?.getCheckInfo().then((checkInfo) => {
      setCheckInfo(checkInfo);
      setLoading(false);
    });
  }, [instance.api]);

  return <CheckInfoContext.Provider value={{ checkInfo, loading }}>{children}</CheckInfoContext.Provider>;
}
