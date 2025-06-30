import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Checkbox, Field, Input, Slider, Stack } from '@grafana/ui';

import { CheckFormValuesAiAgent } from 'types';

export const AiAgentRequest = () => {
  const {
    control,
    register,
    // formState: { errors },
  } = useFormContext<CheckFormValuesAiAgent>();
  const { field } = useController({ name: 'settings.aiagent.aggressiveness', control });
  const { onChange, value } = field;

  return (
    <>
      <Field label="URL" description="Select a URL for the Agent to explore and analyse">
        <Input
          id="aiagent-url"
          {...register('settings.aiagent.url')}
          type="text"
          placeholder={`https://grafana.com/`}
          data-fs-element="AI Agent URL input"
        />
      </Field>
      <Field label="Depth" description="How many levels from the given URL should the Agent dig deeper?">
        <Input
          id="aiagent-depth"
          {...register('settings.aiagent.depth')}
          type="number"
          data-fs-element="AI Agent exploration depth"
        />
      </Field>
      <Field label="Duration" description="How long should the Agent run at the longest? (in minutes)">
        <Input
          id="aiagent-duratio"
          {...register('settings.aiagent.durationInMinutes')}
          type="number"
          data-fs-element="AI Agent max exoloration duration"
        />
      </Field>
      <Field
        label="Page insights options"
        description="Choose which topics the Agent will explore. Choose at least one topic."
      >
        <Stack direction="column" alignItems="flex-start">
          <Checkbox {...register('settings.aiagent.features.insightsAccessibility')} label="Accessibility" />
          <Checkbox {...register('settings.aiagent.features.insightsTechnicalIssues')} label="Technical issues" />
          <Checkbox {...register('settings.aiagent.features.insightsContentQuality')} label="Content quality" />
        </Stack>
      </Field>
      <Field label="Aggressiveness" description="How nitpicky should the Agent be?">
        <Slider {...register('settings.aiagent.aggressiveness')} min={1} max={3} onChange={onChange} value={value} />
      </Field>
    </>
  );
};

AiAgentRequest.displayName = 'AiAgentRequest';
