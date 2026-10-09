import { IconName } from '@grafana/data';
import { encode } from 'js-base64';
import { MAX_TIMEOUT_BROWSER } from 'schemas/forms/BrowserCheckSchema';

import { BrowserCheck, CheckType } from 'types';
import { ONE_HOUR_IN_MS } from 'utils.constants';
import { DEFAULT_CHECK_CONFIG_MAP } from 'components/Checkster/constants';

export type AgenticJourneyStepType = 'action' | 'assertion' | 'wait' | 'agent';

export interface AgenticJourneyStep {
  type: AgenticJourneyStepType;
  instruction: string;
}

export const AGENTIC_JOURNEY_STEP_TYPES: Array<{
  value: AgenticJourneyStepType;
  label: string;
  description: string;
  icon: IconName;
}> = [
  {
    value: 'action',
    label: 'Action',
    icon: 'hand-pointer',
    description: 'Click, type, or select something.',
  },
  {
    value: 'assertion',
    label: 'Assertion',
    icon: 'check-circle',
    description: 'Fail the check unless a condition holds right now.',
  },
  { value: 'wait', label: 'Wait for', icon: 'clock-nine', description: 'Wait until a condition holds, then continue.' },
  {
    value: 'agent',
    label: 'Agent goal',
    icon: 'ai-sparkle',
    description: 'Let the AI work out several actions to reach a goal.',
  },
];

const PAGE_LOAD_TIMEOUT_MS = 30_000;
const WAIT_TIMEOUT_MS = 10_000;
const AGENT_MAX_STEPS = 15;

// Drop-in replacement for k6/browser that adds AI-driven actions, published on jslib.
export const BROWSER_AI_MODULE_URL = 'https://jslib.k6.io/k6-browser-ai/0.1.0/index.js';

export function createAgenticJourneyCheck(
  url: URL,
  steps: AgenticJourneyStep[],
  secretName: string,
  name?: string
): BrowserCheck {
  const defaults = DEFAULT_CHECK_CONFIG_MAP[CheckType.Browser] as BrowserCheck;
  return {
    ...defaults,
    job: name?.trim() || getDefaultName(url),
    target: url.href,
    frequency: ONE_HOUR_IN_MS,
    timeout: MAX_TIMEOUT_BROWSER,
    settings: {
      browser: {
        ...defaults.settings.browser,
        script: encode(createAgenticJourneyScript(url.href, steps, secretName)),
      },
    },
  };
}

function getDefaultName(url: URL) {
  // Check names allow at most 128 characters and cannot contain quotes or commas.
  return `Agentic journey on ${url.href}`
    .replace(/[\x27",]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    .slice(0, 128);
}

function stepToCode({ type, instruction }: AgenticJourneyStep) {
  const text = JSON.stringify(instruction.trim());
  switch (type) {
    case 'action':
      return `await page.ai.act(${text});`;
    case 'assertion':
      return `await page.ai.assert(${text});`;
    case 'wait':
      return `await page.ai.wait(${text}, { timeout: ${WAIT_TIMEOUT_MS} });`;
    case 'agent':
      return `await page.ai.agent(${text}, { maxSteps: ${AGENT_MAX_STEPS} });`;
  }
}

function createAgenticJourneyScript(url: string, steps: AgenticJourneyStep[], secretName: string) {
  const body = steps.map((step) => `    ${stepToCode(step)}`).join('\n');
  return `import { fail } from 'k6';
import secrets from 'k6/secrets';
import { browser } from ${JSON.stringify(BROWSER_AI_MODULE_URL)};

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const apiKey = await secrets.get(${JSON.stringify(secretName)});
  const page = await browser.newPage({ llmOptions: { apiKey } });
  try {
    const response = await page.goto(${JSON.stringify(url)}, { waitUntil: 'networkidle', timeout: ${PAGE_LOAD_TIMEOUT_MS} });
    if (!response || response.status() < 200 || response.status() >= 400) {
      fail('Page failed to load successfully: ' + (response ? 'HTTP ' + response.status() : 'no response'));
    }

${body}
  } finally {
    await page.close();
  }
}
`;
}
