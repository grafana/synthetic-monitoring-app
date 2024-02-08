import React, { useContext,useEffect, useState } from 'react';
import { OrgRole } from '@grafana/data';
import { Button, HorizontalGroup, Modal } from '@grafana/ui';
import { importAllDashboards, listAppDashboards } from 'dashboards/loader';

import { DashboardMeta } from 'types';
import { hasDismissedDashboardUpdateModal, persistDashboardModalDismiss } from 'sessionStorage';
import { hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';

export const DashboardUpdateModal = () => {
  const { instance } = useContext(InstanceContext);
  const [hasDismissedDashboardUpdate, setHasDismissedDashboardUpdate] = useState(hasDismissedDashboardUpdateModal());
  const [dashboardsNeedingUpdate, setDashboardsNeedingUpdate] = useState<DashboardMeta[] | undefined>();
  const dashboards = instance.api?.instanceSettings?.jsonData.dashboards;

  function skipDashboardUpdate() {
    persistDashboardModalDismiss();
    setHasDismissedDashboardUpdate(true);
  }

  // Prompt user to update dashboards that are out of date
  useEffect(() => {
    if (!hasDismissedDashboardUpdate) {
      listAppDashboards().then((latestDashboards) => {
        const existingDashboards = dashboards ?? [];
        const dashboardsNeedingUpdate = existingDashboards
          .map((existingDashboard) => {
            const templateDashboard = latestDashboards.find((template) => template.uid === existingDashboard.uid);
            const templateVersion = templateDashboard?.latestVersion ?? -1;
            if (templateDashboard && templateVersion > existingDashboard.version) {
              return {
                ...existingDashboard,
                version: templateDashboard.latestVersion,
                latestVersion: templateDashboard.latestVersion,
              };
            }
            return null;
          })
          .filter(Boolean) as DashboardMeta[];

        setDashboardsNeedingUpdate(dashboardsNeedingUpdate);
      });
    }
  }, [dashboards, hasDismissedDashboardUpdate]);

  const handleUpdateClick = async () => {
    if (!instance.api) {
      return;
    }
    const responses = await importAllDashboards(
      instance.metrics?.name ?? '',
      instance.logs?.name ?? '',
      instance.api?.name ?? ''
    );
    const updatedSettings = {
      ...instance.api.instanceSettings.jsonData,
      dashboards: responses,
    };
    await instance.api?.onOptionsChange(updatedSettings);

    skipDashboardUpdate();
    window.location.reload();
  };

  return (
    <div>
      <Modal
        title="Dashboards out of date"
        onDismiss={skipDashboardUpdate}
        isOpen={Boolean(dashboardsNeedingUpdate?.length) && !hasDismissedDashboardUpdate && hasRole(OrgRole.Admin)}
      >
        <p>It looks like your Synthetic Monitoring dashboards need an update.</p>
        <HorizontalGroup>
          <Button onClick={handleUpdateClick}>Update</Button>
          <Button onClick={skipDashboardUpdate} fill="text">
            Skip
          </Button>
        </HorizontalGroup>
      </Modal>
    </div>
  );
};
