import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button, Combobox, IconButton, Stack, Text } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';
import { StyledField } from 'components/Checkster/components/ui/StyledField';

import { KG_FRONTEND_APP_ID_LABEL } from './knowledgeGraph';
import { fetchFrontendApps } from './knowledgeGraphApi';
import { useKGLinkedLabel } from './KnowledgeGraphServiceLink.hooks';

export function KnowledgeGraphFrontendLink() {
  const inputId = useDOMId();
  const {
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const frontend = useKGLinkedLabel(KG_FRONTEND_APP_ID_LABEL);
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
    <StyledField label="Frontend application" htmlFor={inputId}>
      <Stack direction="column" gap={1}>
        <Stack alignItems="center" gap={1}>
          <Combobox
            id={inputId}
            aria-label="Frontend application"
            placeholder="Select a frontend application"
            options={options}
            value={selected ?? (frontend.value ? { value: frontend.value, label: `App ID ${frontend.value}` } : null)}
            onChange={(option) => frontend.onChange(option?.value ?? '')}
            disabled={disabled || isLoading || isError}
            loading={isLoading}
          />
          <IconButton
            name="times"
            tooltip="Clear frontend connection"
            disabled={disabled || !frontend.value}
            onClick={() => frontend.onChange('')}
          />
        </Stack>
        {isError ? (
          <Stack alignItems="center">
            <Text color="secondary">Could not load frontend applications. Your saved selection is unchanged.</Text>
            <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </Stack>
        ) : isLoading ? (
          <Text color="secondary">Loading frontend applications…</Text>
        ) : selected ? (
          selectedApp &&
          selectedApp.environments.length > 1 && (
            <Text color="secondary">This connection includes all listed environments for this application.</Text>
          )
        ) : frontend.value ? (
          <Text color="secondary">No matching frontend in Knowledge Graph yet.</Text>
        ) : apps?.length === 0 ? (
          <Text color="secondary">No frontend applications discovered in Knowledge Graph yet.</Text>
        ) : null}
      </Stack>
    </StyledField>
  );
}
