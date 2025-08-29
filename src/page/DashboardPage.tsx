import React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { Spinner } from '@grafana/ui';

import { CheckPageParams, CheckType } from 'types';
import { getCheckType } from 'utils';
import { useChecks } from 'data/useChecks';
import { BrowserDashboard } from 'scenes/BrowserDashboard/BrowserDashboard';
import { DNSDashboard } from 'scenes/DNS/DnsDashboard';
import { GrpcDashboard } from 'scenes/GRPC/GrpcDashboard';
import { HttpDashboard } from 'scenes/HTTP/HttpDashboard';
import { PingDashboard } from 'scenes/PING/PingDashboard';
import { ScriptedDashboard } from 'scenes/Scripted/ScriptedDashboard';
import { TcpDashboard } from 'scenes/TCP/TcpDashboard';
import { TracerouteDashboard } from 'scenes/Traceroute/TracerouteDashboard';

import { CheckNotFound } from './NotFound/CheckNotFound';

function DashboardPageContent() {
  const { data: checks = [], isLoading } = useChecks();
  const { id } = useParams<CheckPageParams>();
  const check = checks.find((check) => String(check.id) === id);

  if (!isLoading && !check) {
    return <CheckNotFound />;
  }

  if (check && getCheckType(check.settings) === CheckType.GRPC) {
    return <GrpcDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.TCP) {
    return <TcpDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.DNS) {
    return <DNSDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.PING) {
    return <PingDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.HTTP) {
    return <HttpDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.Traceroute) {
    return <TracerouteDashboard check={check} />;
  }

  if (
    check &&
    (getCheckType(check.settings) === CheckType.Scripted || getCheckType(check.settings) === CheckType.MULTI_HTTP)
  ) {
    return <ScriptedDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.Browser) {
    return <BrowserDashboard check={check} />;
  }

  return <Spinner />;
}

export function DashboardPage() {
  return <DashboardPageContent />;
}
