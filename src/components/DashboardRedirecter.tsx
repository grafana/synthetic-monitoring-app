import { InstanceContext } from 'contexts/InstanceContext';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { QueryParamMap, useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { useContext } from 'react';
import { FeatureName, ROUTES } from 'types';

export function DashboardRedirecter() {
  const { instance } = useContext(InstanceContext);
  const nav = useNavigation();
  const queryParams = useQuery();
  const { isEnabled: scenesEnabled } = useFeatureFlag(FeatureName.Scenes);
  const dashboard = queryParams.get('dashboard');
  const dashboards = instance.api?.instanceSettings?.jsonData.dashboards;
  if (scenesEnabled) {
    nav('/scene');
    return null;
  }

  if (!dashboard || !dashboards) {
    return null;
  }

  const targetDashboard =
    dashboards?.find((dashboardJson) => dashboardJson.json.indexOf(dashboard) > -1) ?? dashboards[0];

  if (targetDashboard) {
    console.log(queryParams);
    const queryParamsParsed: QueryParamMap = {};
    queryParams.forEach((value, key) => {
      queryParamsParsed[key] = value;
    });
    nav(`/d/${targetDashboard.uid}`, queryParamsParsed, true);
    return null;
  }

  nav(ROUTES.Home);
  return null;
}
