import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Combobox, Stack, Text } from '@grafana/ui';

import { useDOMId } from 'hooks/useDOMId';

import { fetchFrontendApps } from './knowledgeGraphApi';
import { KnowledgeGraphConnectionRow } from './KnowledgeGraphConnectionRow';
import { KGLinkedLabel } from './KnowledgeGraphServiceLink.hooks';

interface Props {
  frontend: KGLinkedLabel;
  disabled?: boolean;
  autoFocus: boolean;
  onRemove: () => void;
}

export function KnowledgeGraphFrontendLink({ frontend, disabled, autoFocus, onRemove }: Props) {
  const labelId = useDOMId();
  const {
    data: apps,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['knowledgeGraph', 'frontendApps'],
    queryFn: fetchFrontendApps,
    staleTime: 60_000,
    retry: false,
  });
  const options = (apps ?? []).map((app) => ({
    value: app.id,
    label: [app.name, ...app.environments].join(' · '),
    description: `App ID ${app.id}`,
  }));
  const selected = options.find((option) => option.value === frontend.value);
  const selectedApp = apps?.find((app) => app.id === frontend.value);

  return (
    <KnowledgeGraphConnectionRow
      label="Frontend application"
      labelId={labelId}
      icon="monitor"
      disabled={disabled}
      autoFocus={autoFocus}
      ready={!isLoading}
      onRemove={onRemove}
    >
      <Stack direction="column" gap={1}>
        <Combobox
          aria-labelledby={labelId}
          placeholder="Select a frontend application"
          options={options}
          value={selected ?? (frontend.value ? { value: frontend.value, label: `App ID ${frontend.value}` } : null)}
          onChange={(option) => frontend.onChange(option.value)}
          disabled={disabled || isLoading || isError}
          loading={isLoading}
        />
        {isError ? (
          <Stack alignItems="center">
            <Text color="secondary" variant="bodySmall">
              Could not load frontend applications. Your saved selection is unchanged.
            </Text>
            <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </Stack>
        ) : isLoading ? (
          <Text color="secondary" variant="bodySmall">
            Loading frontend applications…
          </Text>
        ) : selected ? (
          selectedApp &&
          selectedApp.environments.length > 1 && (
            <Text color="secondary" variant="bodySmall">
              This connection includes all listed environments for this application.
            </Text>
          )
        ) : frontend.value ? (
          <Text color="secondary" variant="bodySmall">
            No matching frontend in Knowledge Graph yet.
          </Text>
        ) : apps?.length === 0 ? (
          <Text color="secondary" variant="bodySmall">
            No frontend applications discovered in Knowledge Graph yet.
          </Text>
        ) : null}
      </Stack>
    </KnowledgeGraphConnectionRow>
  );
}
