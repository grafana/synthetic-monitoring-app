// Libraries
import React, { FC, useContext, useState, useEffect } from 'react';

// Types
import { Check } from 'types';
import { getLocationSrv } from '@grafana/runtime';
import { CheckEditor } from 'components/CheckEditor';
import { CheckList } from 'components/CheckList';
import { InstanceContext } from 'components/InstanceContext';
import { useAlerts } from 'hooks/useAlerts';

interface Props {
  id?: string;
}

export const ChecksPage: FC<Props> = ({ id }) => {
  const { instance } = useContext(InstanceContext);

  const [selectedCheck, setSelectedCheck] = useState<Check>();
  const [checks, setChecks] = useState<Check[]>([]);
  const [addNew, setAddNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const { alertRules, loading: alertsLoading, setRulesForCheck, deleteRulesForCheck } = useAlerts(
    id ? parseInt(id, 10) : undefined
  );

  useEffect(() => {
    instance.api?.listChecks().then(checks => {
      setChecks(checks);
      setLoading(false);
    });
  }, [instance.api]);

  useEffect(() => {
    const num = id ? parseInt(id, 10) : -1;
    const check = checks?.find(c => c.id === num);
    setSelectedCheck(check);
  }, [id, checks]);

  const onGoBack = (refresh: boolean) => {
    setAddNew(false);
    if (refresh) {
      onRefresh();
    }
    getLocationSrv().update({
      partial: true,
      query: {
        id: '',
      },
    });
  };

  const onRefresh = async () => {
    const checks = (await instance.api?.listChecks()) ?? [];
    setChecks(checks);
  };

  const onAddNew = () => setAddNew(true);

  if (loading || !instance.api || alertsLoading) {
    return <div>Loading...</div>;
  }
  if (selectedCheck || addNew) {
    return (
      <CheckEditor
        check={selectedCheck ? selectedCheck : undefined}
        onReturn={onGoBack}
        alertRules={alertRules}
        setRulesForCheck={setRulesForCheck}
        deleteRulesForCheck={deleteRulesForCheck}
      />
    );
  }
  return <CheckList instance={instance} onAddNewClick={onAddNew} checks={checks} />;
};
