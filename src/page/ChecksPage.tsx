import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Check, CheckPageParams, ROUTES } from 'types';
import { CheckEditor } from 'components/CheckEditor';
import { CheckList } from 'components/CheckList';
import { InstanceContext } from 'contexts/InstanceContext';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { useParams } from 'react-router-dom';
import { useNavigation } from 'hooks/useNavigation';

export function ChecksPage() {
  const { instance } = useContext(InstanceContext);
  const [checks, setChecks] = useState<Check[]>();
  const [loading, setLoading] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState<Check>();
  const { view, id } = useParams<CheckPageParams>();
  const navigate = useNavigation();

  const fetchChecks = useCallback(() => {
    instance.api?.listChecks().then((resp) => {
      setChecks(resp);
      setLoading(false);
    });
  }, [instance.api]);

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  useEffect(() => {
    if (checks) {
      const num = id ? parseInt(id, 10) : -1;
      const check = checks?.find((c) => c.id === num);
      setSelectedCheck(check);
    }
  }, [checks, id]);

  const returnToList = (refetch?: boolean) => {
    navigate(ROUTES.Checks);
    if (refetch) {
      fetchChecks();
    }
  };

  const getView = () => {
    switch (view) {
      case 'new': {
        return <CheckEditor onReturn={returnToList} />;
      }
      case 'edit': {
        if (!selectedCheck) {
          return <div>Loading...</div>;
        }
        return <CheckEditor onReturn={returnToList} check={selectedCheck} />;
      }
      default:
        return <CheckList instance={instance} checks={checks ?? []} onCheckUpdate={returnToList} />;
    }
  };

  if (loading || !instance.api || !checks) {
    return <div>Loading...</div>;
  }

  return <SuccessRateContextProvider checks={checks}>{getView()}</SuccessRateContextProvider>;
}
