import React, { Fragment } from 'react';
import { Text } from '@grafana/ui';

import { Probe } from 'types';
import { LabelMode } from 'datasource/responses.types';
import { useLabelMode } from 'data/useLabelMode';

const LABEL_PREFIX = 'label_';

interface ProbeLabelsProps {
  labels: Probe['labels'];
}

export function ProbeLabels({ labels }: ProbeLabelsProps) {
  const { data: labelModeState } = useLabelMode();
  // Only UNPREFIXED tenants write bare label names. DUAL_WRITE still writes the
  // prefixed form alongside, and unknown (still loading) defaults to the legacy
  // prefixed display, matching the rest of the app.
  const prefix = labelModeState?.mode === LabelMode.Unprefixed ? '' : LABEL_PREFIX;

  if (labels.length === 0) {
    return null;
  }

  return labels.map(({ name, value }, index) => {
    return (
      <Fragment key={name}>
        <Text color="maxContrast">
          {`${prefix}${name}`}: <Text color="warning">{value}</Text>
          {labels[index + 1] && ', '}
        </Text>
      </Fragment>
    );
  });
}
