import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePluginComponent } from '@grafana/runtime';
import { Box, Button, Drawer, Spinner, Stack, Tab, TabsBar, Text, Tooltip } from '@grafana/ui';

import { type SLO, type SLOComponentPropsV1, type SLOWizardInitialValues, StepKey } from './grafanaSLOApp.types';
import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Feedback } from 'components/Feedback/Feedback';

import { SLO_WIZARD_COMPONENT_ID } from './grafanaSLOApp.constants';
import { SLODetailTab } from './SLODetailTab';
import { SLOIcon } from './SLOIcon';
import { buildSLOName, buildSLOWizardInitialValuesForCheck } from './SLOIntegration.utils';
import { sloQueryKeys, useDeleteSLO, useSLOsForCheck } from './useSLOCheckLinks';

const NEW_SLO_TAB_KEY = 'new-slo';

function buildWizardInitialValuesForSLO(slo: SLO): SLOWizardInitialValues {
  if (slo.query.type !== 'ratio' || !slo.query.ratio) {
    return {
      name: slo.name,
      description: slo.description,
      labels: slo.labels,
    };
  }

  const ratio = slo.query.ratio;
  const successMetric = ratio.successMetric?.prometheusMetric;
  const totalMetric = ratio.totalMetric?.prometheusMetric;

  const query =
    successMetric && totalMetric
      ? {
          type: 'ratio' as const,
          ratioQuery: {
            successMetric,
            totalMetric,
            groupByLabels: ratio.groupByLabels?.join(',') ?? '',
          },
        }
      : undefined;

  return {
    name: slo.name,
    description: slo.description,
    labels: slo.labels,
    query,
  };
}

type SLOIntegrationProps = {
  check: Check;
};

export function SLOIntegration({ check }: SLOIntegrationProps) {
  const { slos, isLoading } = useSLOsForCheck(check.id);
  const deleteSLO = useDeleteSLO();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('');
  const [editingUuid, setEditingUuid] = useState<string | undefined>();
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
        if (!result.error) {
          await handleSLOListInvalidate();
          const remaining = slos.filter((s) => s.uuid !== slo.uuid);
          setActiveTabKey(remaining.length > 0 ? remaining[0].uuid : NEW_SLO_TAB_KEY);
          if (remaining.length === 0) {
            setDrawerOpen(false);
          }
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
  const isEditingActiveSLO = Boolean(activeSLO && editingUuid === activeSLO.uuid);
  const isWizardReady = !isWizardLoading && Boolean(SLOComponent) && Boolean(metricsDsUid);

  const newSLOInitialValues: SLOWizardInitialValues = buildSLOWizardInitialValuesForCheck(check, slos);

  const editInitialValues = activeSLO && isEditingActiveSLO ? buildWizardInitialValuesForSLO(activeSLO) : undefined;

  const handleOpenDrawer = () => {
    const firstSLOKey = slos.length > 0 ? slos[0].uuid : undefined;
    setActiveTabKey(firstSLOKey ?? NEW_SLO_TAB_KEY);
    setShowNewSLOTab(!firstSLOKey);
    setEditingUuid(undefined);
    setDrawerOpen(true);
  };

  const handleCloseNewSLOTab = () => {
    setShowNewSLOTab(false);
    if (slos.length > 0) {
      setActiveTabKey(slos[0].uuid);
    }
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
                  onChangeTab={() => {
                    setActiveTabKey(slo.uuid);
                    setEditingUuid(undefined);
                  }}
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
              isEditingActiveSLO && isWizardReady && SLOComponent ? (
                <SLOComponent
                  initialValues={editInitialValues}
                  dataSourceUid={metricsDsUid}
                  stepperOrientation="horizontal"
                  submitLabel="Save SLO"
                  onSuccess={() => {
                    setEditingUuid(undefined);
                    handleSLOListInvalidate();
                  }}
                  onCancel={() => setEditingUuid(undefined)}
                  initialStep={StepKey.Review}
                />
              ) : (
                <SLODetailTab
                  slo={activeSLO}
                  onEdit={(slo) => setEditingUuid(slo.uuid)}
                  onDelete={handleDeleteSLO}
                  isDeleting={Boolean(activeSLO && deletingUuid === activeSLO.uuid)}
                />
              )
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
