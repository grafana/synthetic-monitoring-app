import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { useContext } from 'react';
import { ROUTES } from 'types';

export function DashboardRedirecter() {
  const { instance } = useContext(InstanceContext);
  const nav = useNavigation();
  const queryParams = useQuery();
  const dashboard = queryParams.get('dashboard');
  const dashboards = instance.api?.instanceSettings?.jsonData.dashboards;
  if (!dashboard || !dashboards) {
    return null;
  }

  const targetDashboard =
    dashboards?.find((dashboardJson) => dashboardJson.json.indexOf(dashboard) > -1) ?? dashboards[0];

  if (targetDashboard) {
    nav(`/d/${targetDashboard.uid}`, true);
    return null;
  }

  nav(ROUTES.Home);
  return null;
}
