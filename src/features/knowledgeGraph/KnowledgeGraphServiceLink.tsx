import React, { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { useAppPluginInstalled } from '@grafana/runtime';
import { Combobox, ComboboxOption, IconButton, Stack, Switch, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues, Label } from 'types';
import { StyledField } from 'components/Checkster/components/ui/StyledField';

import {
  fetchKGServiceNames,
  fetchKGServiceNamespaces,
  findLabelValue,
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

const LINK_DESCRIPTION = 'This enables the MONITORS relationship in the entity graph.';

export function KnowledgeGraphServiceLink() {
  const styles = useStyles2(getStyles);
  const { value: kgInstalled } = useAppPluginInstalled(KG_PLUGIN_ID);
  const {
    watch,
    setValue,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const labels = watch('labels');

  const serviceName = findLabelValue(labels, KG_SERVICE_NAME_LABEL);
  const namespace = findLabelValue(labels, KG_NAMESPACE_LABEL);

  const [enabled, setEnabled] = useState(Boolean(serviceName || namespace));
  const [serviceOptions, setServiceOptions] = useState<Array<ComboboxOption<string>>>([]);
  const [namespaceOptions, setNamespaceOptions] = useState<Array<ComboboxOption<string>>>([]);

  useEffect(() => {
    if (!kgInstalled || !enabled) {
      return;
    }
    fetchKGServiceNames().then((names) => setServiceOptions(names.map((n) => ({ label: n, value: n }))));
    fetchKGServiceNamespaces().then((ns) => setNamespaceOptions(ns.map((n) => ({ label: n, value: n }))));
  }, [kgInstalled, enabled]);

  const handleServiceNameChange = useCallback(
    (option: ComboboxOption<string> | null) => {
      setValue('labels', setLabelValue(labels, KG_SERVICE_NAME_LABEL, option?.value ?? ''), { shouldDirty: true });
    },
    [labels, setValue]
  );

  const handleNamespaceChange = useCallback(
    (option: ComboboxOption<string> | null) => {
      setValue('labels', setLabelValue(labels, KG_NAMESPACE_LABEL, option?.value ?? ''), { shouldDirty: true });
    },
    [labels, setValue]
  );

  const handleToggle = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      const nextEnabled = event.currentTarget.checked;
      setEnabled(nextEnabled);

      if (!nextEnabled) {
        setValue(
          'labels',
          labels.filter((l) => l.name !== KG_SERVICE_NAME_LABEL && l.name !== KG_NAMESPACE_LABEL),
          { shouldDirty: true }
        );
      }
    },
    [labels, setValue]
  );

  if (!kgInstalled) {
    return null;
  }

  const description = (
    <>
      Link this check to a service discovered by the{' '}
      <TextLink href={`/a/${KG_PLUGIN_ID}/`} external variant="bodySmall">
        Knowledge Graph
      </TextLink>
      . {LINK_DESCRIPTION}
    </>
  );

  return (
    <div className={styles.container}>
      <StyledField label="Link to Knowledge Graph service" description={description} emulate>
        <Switch
          value={enabled}
          onChange={handleToggle}
          disabled={disabled}
          aria-label="Link to Knowledge Graph service"
        />
      </StyledField>
      {enabled && (
        <Stack alignItems="start">
          <StyledField label="Service name" emulate grow>
            <Combobox
              options={serviceOptions}
              value={serviceName || null}
              onChange={handleServiceNameChange}
              placeholder="Select or type a service name"
              createCustomValue
              isClearable
              disabled={disabled}
            />
          </StyledField>
          <StyledField label="Service namespace" emulate grow>
            <Combobox
              options={namespaceOptions}
              value={namespace || null}
              onChange={handleNamespaceChange}
              placeholder="Select or type a namespace"
              createCustomValue
              isClearable
              disabled={disabled}
            />
          </StyledField>
          {/* Spacer to match the trailing remove-button column of the custom labels rows */}
          <IconButton style={{ marginTop: '8px', visibility: 'hidden' }} disabled aria-label="Remove row" name="minus" />
        </Stack>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2, 2, 0, 2),
  }),
});
