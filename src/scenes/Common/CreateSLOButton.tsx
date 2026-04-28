import React, { useMemo, useState } from 'react';
import { usePluginComponent } from '@grafana/runtime';
import { Button, Stack } from '@grafana/ui';

import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { buildSLODescription, buildSLOName, buildSLOQuery, SLORatioQuery } from './CreateSLOButton.utils';

const SLO_COMPONENT_ID = 'grafana-slo-app/wizard/v1';

type SLOComponentPropsV1 = {
  name?: string;
  description?: string;
  dataSourceUid?: string;
  query?: SLORatioQuery;
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

  const sloProps = useMemo(
    () => ({
      name: buildSLOName(check),
      description: buildSLODescription(check),
      dataSourceUid: metricsDsUid,
      query: buildSLOQuery(check),
    }),
    [check, metricsDsUid]
  );

  // Wait for the same metrics datasource SM uses before opening the SLO form.
  // Otherwise the form falls back to another datasource and preselection is wrong.
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

      {isOpen && <SLOComponent {...sloProps} onClose={() => setIsOpen(false)} />}
    </>
  );
}
