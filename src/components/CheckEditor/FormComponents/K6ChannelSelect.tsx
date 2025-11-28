import React, { useEffect, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Combobox, Field, Stack } from '@grafana/ui';

import { CheckFormValues, FeatureName } from 'types';
import { useFilteredK6Channels } from 'data/useK6Channels';
import { useChecksterContext } from 'components/Checkster/contexts/ChecksterContext';
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
  const { check } = useChecksterContext();
  const id = 'k6-channel-select';

  const checkType = getValues('checkType');

  const { field, fieldState } = useController({
    control,
    name: `settings.${checkType === 'scripted' ? 'scripted' : 'browser'}.channel`,
  });

  const { 
    channels, 
    defaultChannelId, 
    isLoading: isLoadingChannels, 
    isError: hasChannelError, 
    error: channelError 
  } = useFilteredK6Channels(true, check); // Always true since this component only renders for scripted/browser

  // Initialize with default channel when no channel is set (new checks or existing checks without channel)
  useEffect(() => {
    if (!field.value && defaultChannelId && !isLoadingChannels) {
      field.onChange(defaultChannelId);
    }
  }, [field, defaultChannelId, isLoadingChannels]);

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
      <ChannelDetails channelId={field.value || defaultChannelId || null} channels={channels} />
    </div>
  );
}
