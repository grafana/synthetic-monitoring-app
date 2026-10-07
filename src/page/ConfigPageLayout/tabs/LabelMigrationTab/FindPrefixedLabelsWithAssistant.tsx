import React, { useId } from 'react';
import { useAssistant } from '@grafana/assistant';
import { Button, Space, Stack, Text } from '@grafana/ui';
import { trackFindPrefixedLabelsWithAssistant } from 'features/tracking/labelMigrationEvents';

import { type Check } from 'types';
import { LabelMode } from 'datasource/responses.types';

import { ConfigContent } from '../../ConfigContent';
import {
  buildPrefixedLabelSearchPrompt,
  getCheckLabelKeys,
  PREFIXED_LABEL_SEARCH_ORIGIN,
} from './prefixedLabelSearchPrompt';

interface FindPrefixedLabelsWithAssistantProps {
  mode: LabelMode.DualWrite | LabelMode.Unprefixed;
  /** Undefined while the check list is loading. */
  checks?: Check[];
  checksError?: boolean;
}

/**
 * Hands Grafana Assistant a read-only search for objects in the stack that
 * still use the prefixed form of the tenant's check labels — the part of the
 * migration Synthetic Monitoring cannot see from here.
 */
export function FindPrefixedLabelsWithAssistant({ mode, checks, checksError }: FindPrefixedLabelsWithAssistantProps) {
  const { isAvailable, openAssistant } = useAssistant();
  const reasonId = useId();

  if (!isAvailable || !openAssistant) {
    return null;
  }

  const labelKeys = getCheckLabelKeys(checks ?? []);
  // Searching with no label names would read as a clean result, so both cases
  // block the search and say why.
  const unavailableReason = checksError
    ? 'Your checks failed to load, so their label names are not available to search for.'
    : checks && labelKeys.length === 0
      ? 'None of your checks have labels, so there are no prefixed label names to search for.'
      : undefined;

  const search = () => {
    trackFindPrefixedLabelsWithAssistant({
      labelKeyCount: labelKeys.length,
      labelMode: mode === LabelMode.DualWrite ? 'dual_write' : 'unprefixed',
    });
    openAssistant({
      origin: PREFIXED_LABEL_SEARCH_ORIGIN,
      prompt: buildPrefixedLabelSearchPrompt(labelKeys),
      autoSend: true,
    });
  };

  return (
    <ConfigContent.Section title="Find objects that still use prefixed labels">
      <Space v={1} />
      <Stack direction="column" gap={1.5} alignItems="flex-start">
        <Text element="p">
          {mode === LabelMode.DualWrite ? (
            <>
              Notification policies, alert rules, dashboards and other objects that still use <code>label_</code> names
              stop matching when you finalize, and nothing reports an error.
            </>
          ) : (
            <>
              Prefixed labels are no longer written, so notification policies, alert rules, dashboards and other objects
              that still use <code>label_</code> names no longer match, and nothing reports an error.
            </>
          )}{' '}
          Grafana Assistant can search this stack for the prefixed names of your check labels and list each place to
          update. It only reports, and can only search what you have access to.
        </Text>
        <Button
          icon="ai-sparkle"
          variant="secondary"
          disabled={!checks || Boolean(unavailableReason)}
          aria-describedby={unavailableReason ? reasonId : undefined}
          onClick={search}
        >
          Find prefixed labels with Assistant
        </Button>
        {unavailableReason && (
          <Text id={reasonId} element="p" variant="bodySmall" color="secondary">
            {unavailableReason}
          </Text>
        )}
      </Stack>
    </ConfigContent.Section>
  );
}
