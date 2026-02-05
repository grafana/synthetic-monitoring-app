import React from 'react';
import { useParams } from 'react-router';
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

  if (check && getCheckType(check.settings) === CheckType.Grpc) {
    return <GrpcDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.Tcp) {
    return <TcpDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.Dns) {
    return <DNSDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.Ping) {
    return <PingDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.Http) {
    return <HttpDashboard check={check} />;
  }

  if (check && getCheckType(check.settings) === CheckType.Traceroute) {
    return <TracerouteDashboard check={check} />;
  }

  if (
    check &&
    (getCheckType(check.settings) === CheckType.Scripted || getCheckType(check.settings) === CheckType.MultiHttp)
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
