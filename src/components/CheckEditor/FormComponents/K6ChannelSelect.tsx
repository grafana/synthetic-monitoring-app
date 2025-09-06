import React, { useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Combobox, Field, Stack } from '@grafana/ui';

import { CheckFormValues, FeatureName } from 'types';
import { useFilteredK6Channels } from 'data/useK6Channels';
import { useCheckFormMetaContext } from 'components/CheckForm/CheckFormContext';
import { FeatureFlag } from 'components/FeatureFlag';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { ChannelDetails } from './ChannelDetails';

interface K6ChannelSelectProps {
  disabled?: boolean;
}

export function K6ChannelSelect({ disabled }: K6ChannelSelectProps) {
  return (
    <FeatureFlag name={FeatureName.VersionManagement}>
      {({ isEnabled }) =>
        isEnabled ? (
          <QueryErrorBoundary
            title="Error loading K6 version channels"
            content="Failed to load version channels. Please check your connection and try again."
          >
            <K6ChannelSelectContent disabled={disabled} />
          </QueryErrorBoundary>
        ) : null
      }
    </FeatureFlag>
  );
}

function K6ChannelSelectContent({ disabled }: K6ChannelSelectProps) {
  const { control, getValues } = useFormContext<CheckFormValues>();
  const { check, isExistingCheck } = useCheckFormMetaContext();
  const id = 'k6-channel-select';

  const checkType = getValues('checkType');

  const { field, fieldState } = useController({
    control,
    name: `settings.${checkType === 'scripted' ? 'scripted' : 'browser'}.channel`,
  });

  const previousChannelId = isExistingCheck
    ? (() => {
        if (checkType === 'scripted' && check?.settings && 'scripted' in check.settings) {
          return check.settings.scripted.channel || null;
        }
        if (checkType === 'browser' && check?.settings && 'browser' in check.settings) {
          return check.settings.browser.channel || null;
        }
        return null;
      })()
    : null;

  const { 
    channels, 
    defaultChannelId, 
    isLoading: isLoadingChannels, 
    isError: hasChannelError, 
    error: channelError 
  } = useFilteredK6Channels(true, {
    isExistingCheck,
    previousChannelId,
  });

  // Throw error to be caught by QueryErrorBoundary if there's an error
  if (hasChannelError && channelError) {
    throw channelError;
  }

  const channelOptions = useMemo(() => {
    return channels.map((channel) => {
      const labelSuffix = channel.default ? ' (default)' : '';

      return {
        label: `${channel.name}.x${labelSuffix}`,
        value: channel.id,
        description: `k6 version range: ${channel.manifest}`,
      };
    });
  }, [channels]);

  return (
    <div>
      <Field
        label="k6 Version"
        description="Select the k6 version channel for this check"
        htmlFor={id}
        data-fs-element="k6 channel select"
        error={fieldState.error?.message}
        invalid={!!fieldState.error}
      >
        <Stack direction="column" gap={2}>
          <Combobox
            {...field}
            value={field.value || defaultChannelId}
            disabled={disabled || isLoadingChannels}
            options={channelOptions}
            id={id}
            createCustomValue={false}
            onChange={(value) => {
              const channelValue = typeof value === 'string' ? value : value?.value || '';
              field.onChange(channelValue);
            }}
            placeholder={isLoadingChannels ? 'Loading channels...' : 'Select k6 version channel'}
            invalid={!!fieldState.error}
          />
        </Stack>
      </Field>
      <ChannelDetails channelId={field.value || defaultChannelId || null} channels={channels} enabled={true} />
    </div>
  );
}
