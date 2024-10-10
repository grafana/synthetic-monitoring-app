import React, { Fragment } from 'react';
import { Text } from '@grafana/ui';

import { Probe } from 'types';

const LABEL_PREFIX = 'label_';

interface ProbeLabelsProps {
  labels: Probe['labels'];
}

export function ProbeLabels({ labels }: ProbeLabelsProps) {
  if (labels.length === 0) {
    return null;
  }

  return labels.map(({ name, value }, index) => {
    return (
      <Fragment key={name}>
        <Text color="maxContrast">
          {`${LABEL_PREFIX}${name}`}: <Text color="warning">{value}</Text>
          {labels[index + 1] && ', '}
        </Text>
      </Fragment>
    );
  });
}
