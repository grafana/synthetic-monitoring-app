import React, { useCallback, useMemo, useState } from 'react';
import { usePluginComponent } from '@grafana/runtime';
import { Button, Drawer, Stack, Text } from '@grafana/ui';

import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Feedback } from 'components/Feedback/Feedback';

import {
  buildSLODescription,
  buildSLOLabels,
  buildSLOName,
  buildSLOQuery,
  type SLOLabel,
  type SLORatioQuery,
} from './CreateSLOButton.utils';

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

type CreateSLOButtonProps = {
  check: Check;
};

export function CreateSLOButton({ check }: CreateSLOButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const metricsDS = useMetricsDS();
  const metricsDsUid = metricsDS?.uid;
  const { component: SLOComponent, isLoading } = usePluginComponent<SLOComponentPropsV1>(SLO_COMPONENT_ID);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sloProps = useMemo(
    (): SLOComponentPropsV1 => ({
      initialValues: {
        name: buildSLOName(check),
        description: buildSLODescription(check),
        query: buildSLOQuery(check),
        labels: buildSLOLabels(check),
      },
      dataSourceUid: metricsDsUid,
      stepperOrientation: 'horizontal',
      onSuccess: handleClose,
      submitLabel: 'Create SLO',
      onClose: handleClose,
    }),
    [check, metricsDsUid, handleClose]
  );

  if (isLoading || !SLOComponent || !metricsDsUid) {
    return null;
  }

  return (
    <>
      <Stack direction="row" gap={1} alignItems="center">
        <Button variant="secondary" icon="clipboard-alt" onClick={() => setIsOpen(true)}>
          Create a SLO
        </Button>
      </Stack>

      {isOpen && (
        <Drawer
          title={
            <Stack direction="row" gap={2} alignItems="center">
              <Text variant="h2">Create SLO</Text>
              <Feedback feature="slo-integration" about={{ text: 'Experimental' }} />
            </Stack>
          }
          onClose={handleClose}
        >
          <SLOComponent {...sloProps} />
        </Drawer>
      )}
    </>
  );
}
