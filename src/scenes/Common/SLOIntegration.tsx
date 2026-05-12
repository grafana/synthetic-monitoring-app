import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePluginComponent } from '@grafana/runtime';
import { Box, Button, Drawer, Stack, Tab, TabsBar, Text } from '@grafana/ui';

import type { SLO } from './useSLOCheckLinks.types';
import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Feedback } from 'components/Feedback/Feedback';

import { buildSLOWizardInitialValuesForCheck, type SLOLabel, type SLORatioQuery } from './CreateSLOButton.utils';
import { SLODetailTab } from './SLODetailTab';
import { SLOIcon } from './SLOIcon';
import { sloQueryKeys, useDeleteSLO, useSLOsForCheck } from './useSLOCheckLinks';

const NEW_SLO_TAB_KEY = 'new-slo';
const SLO_COMPONENT_ID = 'grafana-slo-app/wizard/v1';

type SLOWizardInitialValues = {
  name?: string;
  description?: string;
  query?: SLORatioQuery;
  labels?: SLOLabel[];
};

export enum StepKey {
  Information = 'information',
  Indicator = 'indicator',
  Objective = 'objective',
  Alerts = 'alerts',
  Review = 'review',
}

type SLOComponentPropsV1 = {
  initialValues?: SLOWizardInitialValues;
  dataSourceUid?: string;
  stepperOrientation?: 'horizontal' | 'vertical';
  onSuccess?: () => void;
  submitLabel?: string;
  onCancel: () => void;
  initialStep?: StepKey
};

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
    usePluginComponent<SLOComponentPropsV1>(SLO_COMPONENT_ID);

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

  if (isLoading) {
    return null;
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

  const handleCreateSLOClick = () => {
    setShowNewSLOTab(true);
    setActiveTabKey(NEW_SLO_TAB_KEY);
    setEditingUuid(undefined);
  };

  const handleCloseNewSLOTab = () => {
    setShowNewSLOTab(false);
    if (slos.length > 0) {
      setActiveTabKey(slos[0].uuid);
    }
  };

  const drawerTitle = (
    <Box paddingRight={3}>
      <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between" wrap>
        <Stack direction="row" gap={2} alignItems="center">
          <SLOIcon pixelSize={22} />
          <Text variant="h2">Linked SLOs ({slos.length})</Text>
          <Feedback feature="slo-integration" about={{ text: 'Experimental' }} />
        </Stack>
        {isWizardReady ? (
          <Button variant="primary" icon="plus" onClick={handleCreateSLOClick}>
            New SLO
          </Button>
        ) : null}
      </Stack>
    </Box>
  );

  return (
    <>
      <Button
        variant="secondary"
        icon={<SLOIcon />}
        onClick={handleOpenDrawer}
      >
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
                  label="New SLO"
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
