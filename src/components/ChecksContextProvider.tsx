import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';

import { Check, CheckType } from 'types';
import { checkType as getCheckType } from 'utils';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';

interface Props {}

export function ChecksContextProvider({ children }: PropsWithChildren<Props>) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [scriptedChecks, setScriptedChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchChecks, setFetchChecks] = useState(true);
  const { instance } = useContext(InstanceContext);

  useEffect(() => {
    if (!fetchChecks) {
      return;
    }
    setLoading(true);
    instance.api?.listChecks().then((checks) => {
      const filteredChecks = checks.reduce<{ checks: Check[]; scriptedChecks: Check[] }>(
        (acc, check) => {
          const checkType = getCheckType(check.settings);
          switch (checkType) {
            case CheckType.K6:
              acc.scriptedChecks.push(check);
              break;
            default:
              acc.checks.push(check);
              break;
          }
          return acc;
        },
        { checks: [], scriptedChecks: [] }
      );
      setChecks(filteredChecks.checks);
      setScriptedChecks(filteredChecks.scriptedChecks);
      setLoading(false);
      setFetchChecks(false);
    });
  }, [instance.api, fetchChecks]);

  const refetchChecks = () => setFetchChecks(true);

  return (
    <ChecksContext.Provider value={{ checks, scriptedChecks, loading, refetchChecks }}>
      {children}
    </ChecksContext.Provider>
  );
}
