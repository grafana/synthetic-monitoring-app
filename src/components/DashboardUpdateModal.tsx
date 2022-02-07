import React, { useEffect, useState, useContext } from 'react';
import { DashboardMeta } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { importAllDashboards } from 'dashboards/loader';
import { Button, HorizontalGroup, Modal } from '@grafana/ui';
import { hasDismissedDashboardUpdateModal, persistDashboardModalDismiss } from 'sessionStorage';
import { useNavigation } from 'hooks/useNavigation';
import { getDashboardsNeedingUpdate } from 'auto-update';

export const DashboardUpdateModal = () => {
  const { instance } = useContext(InstanceContext);
  const [hasDismissedDashboardUpdate, setHasDismissedDashboardUpdate] = useState(hasDismissedDashboardUpdateModal());
  const [dashboardsNeedingUpdate, setDashboardsNeedingUpdate] = useState<DashboardMeta[] | undefined>();
  const navigate = useNavigation();
  const dashboards = instance.api?.instanceSettings?.jsonData.dashboards;

  function skipDashboardUpdate() {
    persistDashboardModalDismiss();
    setHasDismissedDashboardUpdate(true);
  }

  // Prompt user to update dashboards that are out of date
  useEffect(() => {
    if (!hasDismissedDashboardUpdate) {
      getDashboardsNeedingUpdate().then((toUpdate) => {
        setDashboardsNeedingUpdate(toUpdate);
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

    navigate('plugins/grafana-synthetic-monitoring-app/', {}, true);
    skipDashboardUpdate();
    window.location.reload();
  };

  return (
    <div>
      <Modal
        title="Dashboards out of date"
        onDismiss={skipDashboardUpdate}
        isOpen={Boolean(dashboardsNeedingUpdate?.length) && !hasDismissedDashboardUpdate}
      >
        <p>It looks like your Synthetic Monitoring dashboards need an update.</p>
        <HorizontalGroup>
          <Button onClick={handleUpdateClick}>Update</Button>
          <Button onClick={skipDashboardUpdate} variant="link">
            Skip
          </Button>
        </HorizontalGroup>
      </Modal>
    </div>
  );
};
