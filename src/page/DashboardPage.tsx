import React from 'react';
import { Navigate, useParams } from 'react-router';
import { Spinner } from '@grafana/ui';

import { CheckPageParams, CheckType } from 'types';
import { getCheckType } from 'utils';
import { useChecks } from 'data/useChecks';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';
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

  const { getPermissions, isResolving: isResolvingFolders } = useCheckFolderAccess(check ? [check] : []);
  const permissions = getPermissions({ folderUid: check?.folderUid });

  if (!isLoading && !check) {
    return <CheckNotFound />;
  }

  // Wait for folder access to settle before evaluating the canRead redirect.
  // During the optimistic loading window a check whose folder has returned 403
  // resolves to `forbidden` (canRead=false) and would redirect prematurely,
  // even when the eventual state is the fallback (canRead=true). See
  // useCheckFolderAccess for details.
  if (isResolvingFolders) {
    return <Spinner />;
  }

  if (!permissions.canRead) {
    return <Navigate to=".." replace />;
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
