import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ComboboxOption } from '@grafana/ui';

import { CheckFormValues, Label } from 'types';

import { findLabelValue } from './knowledgeGraph';
import { fetchServiceMatchExists, fetchServiceNames, fetchServiceNamespaces } from './knowledgeGraphApi';

function upsertLabel(labels: Label[], name: string, value: string): Label[] {
  const filtered = labels.filter((label) => label.name !== name);
  if (!value) {
    return filtered;
  }
  return [...filtered, { name, value }];
}

export interface KGLinkedLabel {
  value: string | undefined;
  isCalManaged: boolean;
  onChange: (value: string) => void;
}

/**
 * CAL-aware accessor for a KG-linked label (`service_name` / `namespace`).
 *
 * When the tenant declares the label as a cost attribution label its value lives in
 * `calLabels` (the row is kept and its value emptied on clear, since CAL rows are fixed);
 * otherwise the value lives in the plain `labels` array (the label is removed on clear).
 * Both the KG service-link section and the CAL rows edit through the same form paths,
 * so the two surfaces stay in sync automatically.
 */
export function useKGLinkedLabel(labelName: string): KGLinkedLabel {
  const { watch, getValues, setValue } = useFormContext<CheckFormValues>();
  const labels = watch('labels') ?? [];
  const calLabels = watch('calLabels') ?? [];

  const calRow = calLabels.find((label) => label.name === labelName);
  const isCalManaged = Boolean(calRow);
  const value = (isCalManaged ? calRow?.value : findLabelValue(labels, labelName)) || undefined;

  const onChange = useCallback(
    (nextValue: string) => {
      // Read through getValues so consecutive writes in one handler don't clobber each other
      const currentCalLabels = getValues('calLabels') ?? [];

      if (currentCalLabels.some((label) => label.name === labelName)) {
        setValue(
          'calLabels',
          currentCalLabels.map((label) => (label.name === labelName ? { ...label, value: nextValue } : label)),
          { shouldDirty: true }
        );
        return;
      }

      setValue('labels', upsertLabel(getValues('labels') ?? [], labelName, nextValue), { shouldDirty: true });
    },
    [getValues, labelName, setValue]
  );

  return { value, isCalManaged, onChange };
}

export type KGServiceProperty = 'name' | 'namespace';

export function useKGServicePropertyOptions(property: KGServiceProperty): Array<ComboboxOption<string>> {
  const [options, setOptions] = useState<Array<ComboboxOption<string>>>([]);

  useEffect(() => {
    let cancelled = false;
    const fetcher = property === 'name' ? fetchServiceNames : fetchServiceNamespaces;

    fetcher().then((values) => {
      if (!cancelled) {
        setOptions(values.map((value) => ({ label: value, value })));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [property]);

  return options;
}

export type KGServiceMatchState = 'idle' | 'checking' | 'match' | 'no-match';

/**
 * Live indicator state for the service link: does a Service entity matching the current
 * service_name (+ namespace, when set) exist in the Knowledge Graph right now?
 * Lookup failures resolve to 'idle' so the UI stays quiet rather than showing a false negative.
 */
export function useKGServiceMatch(serviceName?: string, namespace?: string): KGServiceMatchState {
  const [state, setState] = useState<KGServiceMatchState>('idle');

  useEffect(() => {
    if (!serviceName) {
      setState('idle');
      return;
    }

    let cancelled = false;
    setState('checking');

    fetchServiceMatchExists(serviceName, namespace).then((exists) => {
      if (cancelled) {
        return;
      }
      setState(exists === null ? 'idle' : exists ? 'match' : 'no-match');
    });

    return () => {
      cancelled = true;
    };
  }, [serviceName, namespace]);

  return state;
}
