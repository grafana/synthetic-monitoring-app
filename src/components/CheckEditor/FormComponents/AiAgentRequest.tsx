import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Checkbox, Field, Input, Slider, Stack } from '@grafana/ui';

import { CheckFormValuesAiAgent } from 'types';

export const AiAgentRequest = () => {
  const {
    control,
    register,
    watch,
    // formState: { errors },
  } = useFormContext<CheckFormValuesAiAgent>();
  const { field } = useController({ name: 'settings.aiagent.aggressiveness', control });
  const { onChange, value } = field;

  const userJourneysEnabled = watch('settings.aiagent.userJourneys.enabled');

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
      <Field label="Maximum depth" description="How many levels from the given URL should the Agent dig deeper?">
        <Input
          id="aiagent-depth"
          {...register('settings.aiagent.depth', { valueAsNumber: true })}
          type="number"
          data-fs-element="AI Agent exploration depth"
        />
      </Field>
      <Field label="Maximum size" description="How many pages should the Agent explore?">
        <Input
          id="aiagent-size"
          {...register('settings.aiagent.size', { valueAsNumber: true })}
          type="number"
          data-fs-element="AI Agent exploration size"
        />
      </Field>
      <Field label="Maximum duration" description="How long should the Agent run at the longest? (in minutes)">
        <Input
          id="aiagent-duratin"
          {...register('settings.aiagent.durationInMinutes', { valueAsNumber: true })}
          type="number"
          data-fs-element="AI Agent max exoloration duration"
        />
      </Field>
      <Field label="Maximum concurrency" description="How many pages should the Agent explore at the same time?">
        <Input
          id="aiagent-concurrency"
          {...register('settings.aiagent.concurrency', { valueAsNumber: true })}
          type="number"
          data-fs-element="AI Agent exploration concurrency"
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
      <Field label="Test user journeys" description="Make the agent explore and test user journeys">
        <Checkbox {...register('settings.aiagent.userJourneys.enabled')} label="Enable user journeys" />
      </Field>
      {userJourneysEnabled && (
        <>
          <Field label="Max user journeys" description="The maximum number of user journeys the agent will explore">
            <Input
              id="aiagent-max-user-journeys"
              {...register('settings.aiagent.userJourneys.maxUserJourneys')}
              type="number"
              data-fs-element="AI Agent max user journeys"
            />
          </Field>
          <Field
            label="Max steps per journey"
            description="The maximum number of steps per user journey the agent will explore"
          >
            <Input
              id="aiagent-max-steps-per-journey"
              {...register('settings.aiagent.userJourneys.maxStepsPerJourney')}
              type="number"
              data-fs-element="AI Agent max steps per journey"
            />
          </Field>
        </>
      )}
    </>
  );
};

AiAgentRequest.displayName = 'AiAgentRequest';
