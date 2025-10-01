import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { PluginPage } from '@grafana/runtime';

import { CheckType } from 'types';
import { useChecks } from 'data/useChecks';

import { Checkster } from '../Checkster';
import { ChecksterProvider } from '../contexts/ChecksterContext';

export function DevChecksterPage() {
  const [params] = useSearchParams({});
  const { data: checks, isLoading } = useChecks();

  const checkType = params.get('checkType');
  const id = params.get('id');

  const check = useMemo(() => {
    if (isLoading) {
      return undefined;
    }

    if (id) {
      const idInt = Number(id);
      return checks?.find((check) => check.id === idInt);
    }

    if (checkType) {
      return { type: checkType as CheckType };
    }

    return undefined;
  }, [checkType, checks, id, isLoading]);

  useEffect(() => {
    console.log('[DEV] CHECK', check);
  }, [check]);

  if (isLoading) {
    return <div>Loading checks...</div>;
  }

  return (
    <PluginPage>
      <ChecksterProvider check={check}>
        <Checkster
          onSave={(payload) => {
            console.log('Checkster.onSave', payload);
            return Promise.resolve();
          }}
        />
      </ChecksterProvider>
    </PluginPage>
  );
}
