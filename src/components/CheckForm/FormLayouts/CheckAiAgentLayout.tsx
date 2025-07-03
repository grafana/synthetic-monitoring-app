import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValues, CheckType } from 'types';
import { AiAgentFields } from 'components/CheckEditor/CheckEditor.types';
import { AiAgentRequest } from 'components/CheckEditor/FormComponents/AiAgentRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const AIAGENT_CHECK_FIELDS: AiAgentFields = {
  url: {
    name: `settings.aiagent.url`,
  },
  depth: {
    name: `settings.aiagent.depth`,
  },
  size: {
    name: `settings.aiagent.size`,
  },
  concurrency: {
    name: `settings.aiagent.concurrency`,
  },
  durationInMinutes: {
    name: `settings.aiagent.durationInMinutes`,
  },
  aggressiveness: {
    name: `settings.aiagent.aggressiveness`,
  },
};

export const AiAgentCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValues>>> = {
  [LayoutSection.Check]: {
    fields: Object.values(AIAGENT_CHECK_FIELDS).map((field) => field.name),
    Component: <AiAgentRequest />,
  },
  [LayoutSection.Uptime]: {
    fields: [`timeout`],
    Component: <Timeout checkType={CheckType.AiAgent} />,
  },
};
