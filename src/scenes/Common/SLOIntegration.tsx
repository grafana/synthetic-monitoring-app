import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePluginComponent } from '@grafana/runtime';
import { Box, Button, Drawer, Spinner, Stack, Tab, TabsBar, Text, Tooltip } from '@grafana/ui';

import { type SLO, type SLOComponentPropsV1, type SLOWizardInitialValues, StepKey } from './grafanaSLOApp.types';
import { Check } from 'types';
import { showAlert } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Feedback } from 'components/Feedback/Feedback';

import { SLO_WIZARD_COMPONENT_ID } from './grafanaSLOApp.constants';
import { SLODetailTab } from './SLODetailTab';
import { SLOIcon } from './SLOIcon';
import { buildSLOName, buildSLOWizardInitialValuesForCheck } from './SLOIntegration.utils';
import { sloQueryKeys, useDeleteSLO, useSLOsForCheck } from './useSLOCheckLinks';

const NEW_SLO_TAB_KEY = 'new-slo';

type SLOIntegrationProps = {
  check: Check;
};

export function SLOIntegration({ check }: SLOIntegrationProps) {
  const { slos, isLoading } = useSLOsForCheck(check.id);
  const deleteSLO = useDeleteSLO();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('');
  const [showNewSLOTab, setShowNewSLOTab] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const metricsDS = useMetricsDS();
  const metricsDsUid = metricsDS?.uid;
  const { component: SLOComponent, isLoading: isWizardLoading } =
    usePluginComponent<SLOComponentPropsV1>(SLO_WIZARD_COMPONENT_ID);

  const handleSLOListInvalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: sloQueryKeys.all }),
    [queryClient]
  );

  const handleDeleteSLO = useCallback(
    async (slo: SLO) => {
      setDeletingUuid(slo.uuid);
      try {
        const result = await deleteSLO(slo.uuid);
        if (result.error) {
          showAlert('error', `Failed to delete SLO: ${result.error.message}`);
          return;
        }

        await handleSLOListInvalidate();
        const remaining = slos.filter((s) => s.uuid !== slo.uuid);
        setActiveTabKey(remaining.length > 0 ? remaining[0].uuid : NEW_SLO_TAB_KEY);
        if (remaining.length === 0) {
          setDrawerOpen(false);
        }
      } finally {
        setDeletingUuid(undefined);
      }
    },
    [slos, deleteSLO, handleSLOListInvalidate]
  );

  const LOADING_SLO_TOOLTIP = 'Loading linked SLOs';

  if (isLoading) {
    return (
      <Tooltip content={LOADING_SLO_TOOLTIP}>
        <span aria-label={LOADING_SLO_TOOLTIP} data-testid="slo-integration-loading" role="status">
          <Spinner />
        </span>
      </Tooltip>
    );
  }

  const countLabel = slos.length > 0 ? (slos.length === 1 ? '1 SLO' : `${slos.length} SLOs`) : 'SLOs';
  const activeSLO = slos.find((slo) => slo.uuid === activeTabKey);
  const isWizardReady = !isWizardLoading && Boolean(SLOComponent) && Boolean(metricsDsUid);

  const newSLOInitialValues: SLOWizardInitialValues = buildSLOWizardInitialValuesForCheck(check);

  const handleOpenDrawer = () => {
    const firstSLOKey = slos.length > 0 ? slos[0].uuid : undefined;
    setActiveTabKey(firstSLOKey ?? NEW_SLO_TAB_KEY);
    setShowNewSLOTab(!firstSLOKey);
    setDrawerOpen(true);
  };

  const handleCloseNewSLOTab = () => {
    setShowNewSLOTab(false);
    if (slos.length > 0) {
      setActiveTabKey(slos[0].uuid);
      return;
    }
    setDrawerOpen(false);
  };

  const drawerTitle = (
    <Box paddingRight={3}>
      <Stack direction="row" gap={2} alignItems="center" wrap>
        <SLOIcon pixelSize={22} />
        <Text variant="h2">Linked SLOs ({slos.length})</Text>
        <Feedback feature="slo-integration" about={{ text: 'Experimental' }} />
      </Stack>
    </Box>
  );

  return (
    <>
      <Button variant="secondary" icon={<SLOIcon />} onClick={handleOpenDrawer}>
        {countLabel}
      </Button>

      {drawerOpen && (
        <Drawer title={drawerTitle} onClose={() => setDrawerOpen(false)}>
          <Stack direction="column" gap={2}>
            <TabsBar>
              {slos.map((slo) => (
                <Tab
                  key={slo.uuid}
                  label={slo.name}
                  active={activeTabKey === slo.uuid}
                  onChangeTab={() => setActiveTabKey(slo.uuid)}
                />
              ))}
              {showNewSLOTab ? (
                <Tab
                  key={NEW_SLO_TAB_KEY}
                  label={buildSLOName(check)}
                  active={activeTabKey === NEW_SLO_TAB_KEY}
                  onChangeTab={() => setActiveTabKey(NEW_SLO_TAB_KEY)}
                />
              ) : null}
            </TabsBar>

            {activeSLO ? (
              <SLODetailTab
                slo={activeSLO}
                onDelete={handleDeleteSLO}
                isDeleting={Boolean(activeSLO && deletingUuid === activeSLO.uuid)}
              />
            ) : null}

            {activeTabKey === NEW_SLO_TAB_KEY && isWizardReady && SLOComponent ? (
              <SLOComponent
                initialValues={newSLOInitialValues}
                dataSourceUid={metricsDsUid}
                stepperOrientation="horizontal"
                submitLabel="Create SLO"
                onSuccess={() => {
                  handleCloseNewSLOTab();
                  setDrawerOpen(false);
                  handleSLOListInvalidate();
                }}
                onCancel={handleCloseNewSLOTab}
                initialStep={StepKey.Review}
              />
            ) : null}
          </Stack>
        </Drawer>
      )}
    </>
  );
}
