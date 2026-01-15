import React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { Spinner } from '@grafana/ui';

import { CheckPageParams, CheckType } from 'types';
import { getCheckType } from 'utils';
import { useChecks } from 'data/useChecks';
import { useCheckAccess } from 'hooks/useCheckAccess';
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
  const hasAccess = useCheckAccess(check);

  // Loading state
  if (isLoading || hasAccess === null) {
    return <Spinner />;
  }

  // No access to check (folder permission denied)
  if (hasAccess === false) {
    return <CheckNotFound />;
  }

  // Check doesn't exist
  if (!check) {
    return <CheckNotFound />;
  }

  const checkType = getCheckType(check.settings);

  if (checkType === CheckType.GRPC) {
    return <GrpcDashboard check={check} />;
  }

  if (checkType === CheckType.TCP) {
    return <TcpDashboard check={check} />;
  }

  if (checkType === CheckType.DNS) {
    return <DNSDashboard check={check} />;
  }

  if (checkType === CheckType.PING) {
    return <PingDashboard check={check} />;
  }

  if (checkType === CheckType.HTTP) {
    return <HttpDashboard check={check} />;
  }

  if (checkType === CheckType.Traceroute) {
    return <TracerouteDashboard check={check} />;
  }

  if (checkType === CheckType.Scripted || checkType === CheckType.MULTI_HTTP) {
    return <ScriptedDashboard check={check} />;
  }

  if (checkType === CheckType.Browser) {
    return <BrowserDashboard check={check} />;
  }

  return <Spinner />;
}

export function DashboardPage() {
  return <DashboardPageContent />;
}
