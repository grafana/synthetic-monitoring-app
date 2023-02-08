import { Spinner } from '@grafana/ui';
import { ConfigActions } from 'components/ConfigActions';
import { ProgrammaticManagement } from 'components/ProgrammaticManagement';
import { TenantSetup } from 'components/TenantSetup';
import { InstanceContext } from 'contexts/InstanceContext';
import React, { useContext } from 'react';

export function ConfigPage() {
  const { meta, loading } = useContext(InstanceContext);
  if (loading) {
    return <Spinner />;
  }
  return (
    <div>
      <div className="card-item">
        <div>
          <h4>Synthetic Monitoring App</h4>
        </div>
        <div>
          <p>
            Synthetic Monitoring is a blackbox monitoring solution provided as part of{' '}
            <a
              className="highlight-word"
              href="https://grafana.com/products/cloud/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Grafana Cloud
            </a>
            . If you don&apos;t already have a Grafana Cloud service,{' '}
            <a
              className="highlight-word"
              href="https://grafana.com/signup/cloud"
              target="_blank"
              rel="noopener noreferrer"
            >
              sign up now{' '}
            </a>
          </p>
        </div>
      </div>
      <br />
      <TenantSetup />
      <br />
      {meta?.enabled && <ProgrammaticManagement />}
      <br />
      <br />
      <br />
      <ConfigActions enabled={meta?.enabled} pluginId={meta?.id ?? 'grafana-synthetic-monitoring-app'} />
      <br />
      <br />
      <br />
      <div>Plugin version: {meta?.info.version}</div>
    </div>
  );
}
