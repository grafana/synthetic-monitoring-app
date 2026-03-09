import React, { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Combobox, Field, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues, Label } from 'types';

import {
  fetchKGServiceNames,
  fetchKGServiceNamespaces,
  findLabelValue,
  isKnowledgeGraphAvailable,
  KG_NAMESPACE_LABEL,
  KG_PLUGIN_ID,
  KG_SERVICE_NAME_LABEL,
} from './knowledgeGraph';

function setLabelValue(labels: Label[], name: string, value: string): Label[] {
  const filtered = labels.filter((l) => l.name !== name);
  if (!value) {
    return filtered;
  }
  return [...filtered, { name, value }];
}

export function KnowledgeGraphServiceLink() {
  const styles = useStyles2(getStyles);
  const { watch, setValue } = useFormContext<CheckFormValues>();
  const labels = watch('labels');

  const serviceName = findLabelValue(labels, KG_SERVICE_NAME_LABEL);
  const namespace = findLabelValue(labels, KG_NAMESPACE_LABEL);

  const [serviceOptions, setServiceOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [namespaceOptions, setNamespaceOptions] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    fetchKGServiceNames().then((names) => setServiceOptions(names.map((n) => ({ label: n, value: n }))));
    fetchKGServiceNamespaces().then((ns) => setNamespaceOptions(ns.map((n) => ({ label: n, value: n }))));
  }, []);

  const handleServiceNameChange = useCallback(
    (option: { value: string } | null) => {
      const updated = setLabelValue(labels, KG_SERVICE_NAME_LABEL, option?.value ?? '');
      setValue('labels', updated, { shouldDirty: true });
    },
    [labels, setValue]
  );

  const handleNamespaceChange = useCallback(
    (option: { value: string } | null) => {
      const updated = setLabelValue(labels, KG_NAMESPACE_LABEL, option?.value ?? '');
      setValue('labels', updated, { shouldDirty: true });
    },
    [labels, setValue]
  );

  if (!isKnowledgeGraphAvailable()) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Stack direction="column" gap={3}>
        <Stack direction="column" gap={0.5}>
          <Text variant="h6">Link to Knowledge Graph service</Text>
          <Text variant="bodySmall" color="secondary">
            Optionally link this check to a service discovered by the{' '}
            <TextLink href={`/a/${KG_PLUGIN_ID}/`} external variant="bodySmall">
              Knowledge Graph
            </TextLink>
            . This enables the MONITORS relationship in the entity graph.
          </Text>
        </Stack>
        <Stack direction="row" gap={2}>
          <Field label="Service name" className={styles.field}>
            <Combobox
              options={serviceOptions}
              value={serviceName || null}
              onChange={handleServiceNameChange}
              placeholder="Select or type a service name"
              createCustomValue
              width={40}
            />
          </Field>
          <Field label="Service namespace" className={styles.field}>
            <Combobox
              options={namespaceOptions}
              value={namespace || null}
              onChange={handleNamespaceChange}
              placeholder="Select or type a namespace"
              createCustomValue
              width={40}
            />
          </Field>
        </Stack>
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
  }),
  field: css({
    marginBottom: 0,
  }),
});
