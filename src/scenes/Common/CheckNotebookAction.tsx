import React, { useState } from 'react';
import { config, usePluginComponent } from '@grafana/runtime';
import { useTimeRange, useVariableInterpolator, useVariableValues } from '@grafana/scenes-react';
import { Button, Dropdown, Menu, Modal } from '@grafana/ui';

import { Check } from 'types';
import { getCheckType } from 'utils';
import { useMetricsDS } from 'hooks/useMetricsDS';

import {
  ADD_TO_NOTEBOOK_COMPONENT_ID,
  AddToNotebookFormProps,
  buildCheckNotebookSnapshot,
  CheckNotebookSnapshot,
} from './checkNotebookContext';

export function CheckNotebookAction({ check }: { check: Check }) {
  const { component: AddToNotebookForm, isLoading } =
    usePluginComponent<AddToNotebookFormProps>(ADD_TO_NOTEBOOK_COMPONENT_ID);
  const [timeRange, sceneTimeRange] = useTimeRange();
  const [probeValues, probesLoading] = useVariableValues<string>('probe');
  const interpolate = useVariableInterpolator({ variables: ['probe'] });
  const metricsDS = useMetricsDS();
  const [snapshot, setSnapshot] = useState<CheckNotebookSnapshot>();
  const permissions = config.bootData.user.permissions;
  const canAdd = Boolean(permissions?.['notebooks:create'] || permissions?.['notebooks:write']);
  const checkId = check.id;

  if (isLoading || !AddToNotebookForm || !canAdd || probesLoading || !probeValues || checkId === undefined) {
    return null;
  }

  const onClose = () => setSnapshot(undefined);
  const onOpen = () => {
    const timeZone = sceneTimeRange.getTimeZone();
    setSnapshot(
      buildCheckNotebookSnapshot({
        check: { id: checkId, job: check.job },
        checkType: getCheckType(check.settings),
        timeRange,
        timeZone: timeZone === 'browser' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timeZone,
        probeValues,
        resolvedProbeFilter: interpolate('$probe'),
        metricsDatasourceUid: metricsDS?.uid,
        appSubUrl: config.appSubUrl,
        origin: window.location.origin,
      })
    );
  };

  return (
    <>
      <Dropdown
        placement="bottom-end"
        overlay={
          <Menu>
            <Menu.Item label="Add to notebook" icon="book" description="Selected check context only" onClick={onOpen} />
          </Menu>
        }
      >
        <Button variant="secondary" icon="angle-down" aria-label="Check actions">
          Actions
        </Button>
      </Dropdown>
      {snapshot && (
        <Modal title="Add check context to notebook" isOpen onDismiss={onClose}>
          <AddToNotebookForm {...snapshot} onClose={onClose} onAdded={onClose} />
        </Modal>
      )}
    </>
  );
}
