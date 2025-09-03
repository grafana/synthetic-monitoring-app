import React, { useEffect, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Combobox, Field, Stack } from '@grafana/ui';

import { CheckFormValues, FeatureName } from 'types';
import { useK6Channels } from 'data/useK6Channels';
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
  const { control, setValue, getValues } = useFormContext<CheckFormValues>();
  const { check, isExistingCheck } = useCheckFormMetaContext();
  const id = 'k6-channel-select';

  const checkType = getValues('checkType');

  const { field, fieldState } = useController({
    control,
    name: `settings.${checkType === 'scripted' ? 'scripted' : 'browser'}.channel`,
  });

  const { data: channelsResponse, isLoading: isLoadingChannels } = useK6Channels(true);

  const channels = useMemo(() => channelsResponse?.channels || [], [channelsResponse?.channels]);

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

  const defaultChannelId = useMemo(() => {
    return channels.find((channel) => channel.default)?.id || '';
  }, [channels]);

  // Set the field value to the default channel if no value is currently set and we have a default
  useEffect(() => {
    const defaultChannel = channels.find((channel) => channel.id === defaultChannelId);
    if (!field.value && defaultChannelId && defaultChannel) {
      field.onChange(defaultChannelId);
    }
  }, [defaultChannelId, channels, field]);

  // Set channelDisabled flag when channels load or current value changes
  useEffect(() => {
    const currentChannelId = field.value || defaultChannelId;
    const selectedChannel = channels.find((channel) => channel.id === currentChannelId);
    if (currentChannelId && selectedChannel) {
      const isDisabled = new Date(selectedChannel.disabledAfter) < new Date();
      setValue('channelDisabled', isDisabled);
    } else {
      setValue('channelDisabled', false);
    }
  }, [field.value, defaultChannelId, channels, setValue]);

  const channelOptions = useMemo(() => {
    return channels
      .filter((channel) => {
        const isDeprecated = new Date(channel.deprecatedAfter) < new Date();
        const isDisabled = new Date(channel.disabledAfter) < new Date();

        // Skip deprecated channels for new checks
        if (isDeprecated && !isExistingCheck) {
          return false;
        }

        // Skip deprecated channels for existing checks unless it was previously assigned
        if (isDeprecated && isExistingCheck && channel.id !== previousChannelId) {
          return false;
        }

        // Skip disabled channels for new checks
        if (isDisabled && !isExistingCheck) {
          return false;
        }

        // Skip disabled channels for existing checks unless it was previously assigned
        if (isDisabled && isExistingCheck && channel.id !== previousChannelId) {
          return false;
        }

        return true;
      })
      .map((channel) => {
        const labelSuffix = channel.default ? ' (default)' : '';

        return {
          label: `${channel.name}.x${labelSuffix}`,
          value: channel.id,
          description: `k6 version range: ${channel.manifest}`,
        };
      });
  }, [channels, isExistingCheck, previousChannelId]);

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
