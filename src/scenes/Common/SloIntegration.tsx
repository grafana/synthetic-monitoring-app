import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePluginComponent } from '@grafana/runtime';
import { Box, Button, Drawer, Stack, Tab, TabsBar, Text } from '@grafana/ui';

import type { Slo } from './useSmCheckSlos.types';
import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Feedback } from 'components/Feedback/Feedback';

import { buildSLOWizardInitialValuesForCheck, type SLOLabel, type SLORatioQuery } from './CreateSLOButton.utils';
import { SloDetailTab } from './SloDetailTab';
import { SLOIcon } from './SLOIcon';
import { linkSloToCheck, smCheckSlosQueryKeys, useSmCheckSlos } from './useSmCheckSlos';
import { isSloLinkedByLabel } from './useSmCheckSlos.utils';

const NEW_SLO_TAB_KEY = 'new-slo';
const SLO_COMPONENT_ID = 'grafana-slo-app/wizard/v1';

type SLOWizardInitialValues = {
  name?: string;
  description?: string;
  query?: SLORatioQuery;
  labels?: SLOLabel[];
};

type SLOComponentPropsV1 = {
  initialValues?: SLOWizardInitialValues;
  dataSourceUid?: string;
  stepperOrientation?: 'horizontal' | 'vertical';
  onSuccess?: () => void;
  submitLabel?: string;
  onClose: () => void;
};

function buildWizardInitialValuesForSlo(slo: Slo): SLOWizardInitialValues {
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

type SloIntegrationProps = {
  check: Check;
};

export function SloIntegration({ check }: SloIntegrationProps) {
  const { slos, isLoading, updateSlo, deleteSlo } = useSmCheckSlos(check.id, check.job);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('');
  const [editingUuid, setEditingUuid] = useState<string | undefined>();
  const [showNewSloTab, setShowNewSloTab] = useState(false);
  const [linkingUuid, setLinkingUuid] = useState<string | undefined>();
  const [deletingUuid, setDeletingUuid] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const metricsDS = useMetricsDS();
  const metricsDsUid = metricsDS?.uid;
  const { component: SLOComponent, isLoading: isWizardLoading } =
    usePluginComponent<SLOComponentPropsV1>(SLO_COMPONENT_ID);

  const handleSloListInvalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: smCheckSlosQueryKeys.all }),
    [queryClient]
  );

  const handleLinkToCheck = useCallback(async () => {
    const slo = slos.find((s) => s.uuid === activeTabKey);
    const checkId = check.id !== undefined ? String(check.id) : '';
    if (!slo || !checkId) {
      return;
    }
    setLinkingUuid(slo.uuid);
    try {
      const result = await linkSloToCheck(slo, checkId, updateSlo);
      if (!result.error) {
        handleSloListInvalidate();
      }
    } finally {
      setLinkingUuid(undefined);
    }
  }, [activeTabKey, check.id, slos, updateSlo, handleSloListInvalidate]);

  const handleDeleteSlo = useCallback(
    async (slo: Slo) => {
      setDeletingUuid(slo.uuid);
      try {
        const result = await deleteSlo(slo.uuid);
        if (!result.error) {
          await handleSloListInvalidate();
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
    [slos, deleteSlo, handleSloListInvalidate]
  );

  if (isLoading) {
    return null;
  }

  const countLabel = slos.length > 0 ? (slos.length === 1 ? '1 SLO' : `${slos.length} SLOs`) : 'SLOs';
  const activeSlo = slos.find((slo) => slo.uuid === activeTabKey);
  const checkIdStr = check.id !== undefined ? String(check.id) : '';
  const hasSmCheckIdLabel = Boolean(activeSlo?.labels?.some((l) => l.key === 'sm_check_id'));
  const isLinkedToThisCheck = Boolean(
    activeSlo && checkIdStr && isSloLinkedByLabel(activeSlo, checkIdStr)
  );
  const isUnlinkedQueryMatch = Boolean(
    activeSlo && checkIdStr && !hasSmCheckIdLabel && !isLinkedToThisCheck
  );
  const isLinkedToOtherCheck = Boolean(
    activeSlo && checkIdStr && hasSmCheckIdLabel && !isLinkedToThisCheck
  );
  const isEditingActiveSlo = Boolean(activeSlo && editingUuid === activeSlo.uuid);
  const isWizardReady = !isWizardLoading && Boolean(SLOComponent) && Boolean(metricsDsUid);
  const WizardComponent = SLOComponent;

  const newSloInitialValues: SLOWizardInitialValues = buildSLOWizardInitialValuesForCheck(check, slos);

  const editInitialValues = activeSlo && isEditingActiveSlo ? buildWizardInitialValuesForSlo(activeSlo) : undefined;

  const handleOpenDrawer = () => {
    const firstSloKey = slos.length > 0 ? slos[0].uuid : undefined;
    setActiveTabKey(firstSloKey ?? NEW_SLO_TAB_KEY);
    setShowNewSloTab(!firstSloKey);
    setEditingUuid(undefined);
    setDrawerOpen(true);
  };

  const handleCreateSloClick = () => {
    setShowNewSloTab(true);
    setActiveTabKey(NEW_SLO_TAB_KEY);
    setEditingUuid(undefined);
  };

  const handleCloseNewSloTab = () => {
    setShowNewSloTab(false);
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
          <Button variant="primary" icon="plus" onClick={handleCreateSloClick}>
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
              {showNewSloTab ? (
                <Tab
                  key={NEW_SLO_TAB_KEY}
                  label="New SLO"
                  active={activeTabKey === NEW_SLO_TAB_KEY}
                  onChangeTab={() => setActiveTabKey(NEW_SLO_TAB_KEY)}
                />
              ) : null}
            </TabsBar>

            {activeSlo ? (
              isEditingActiveSlo && isWizardReady && WizardComponent ? (
                <WizardComponent
                  initialValues={editInitialValues}
                  dataSourceUid={metricsDsUid}
                  stepperOrientation="horizontal"
                  submitLabel="Save SLO"
                  onSuccess={() => {
                    setEditingUuid(undefined);
                    handleSloListInvalidate();
                  }}
                  onClose={() => setEditingUuid(undefined)}
                />
              ) : (
                <SloDetailTab
                  slo={activeSlo}
                  onEdit={(slo) => setEditingUuid(slo.uuid)}
                  onDelete={handleDeleteSlo}
                  isDeleting={Boolean(activeSlo && deletingUuid === activeSlo.uuid)}
                  isUnlinkedQueryMatch={isUnlinkedQueryMatch}
                  isLinkedToOtherCheck={isLinkedToOtherCheck}
                  onLinkToCheck={handleLinkToCheck}
                  isLinking={Boolean(activeSlo && linkingUuid === activeSlo.uuid)}
                />
              )
            ) : null}

            {activeTabKey === NEW_SLO_TAB_KEY && isWizardReady && WizardComponent ? (
              <WizardComponent
                initialValues={newSloInitialValues}
                dataSourceUid={metricsDsUid}
                stepperOrientation="horizontal"
                submitLabel="Create SLO"
                onSuccess={() => {
                  handleCloseNewSloTab();
                  setDrawerOpen(false);
                  handleSloListInvalidate();
                }}
                onClose={handleCloseNewSloTab}
              />
            ) : null}
          </Stack>
        </Drawer>
      )}
    </>
  );
}
