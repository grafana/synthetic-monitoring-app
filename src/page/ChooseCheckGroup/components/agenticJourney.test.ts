import { decode } from 'js-base64';

import { AgenticJourneyStep, createAgenticJourneyCheck } from './agenticJourney';

const steps: AgenticJourneyStep[] = [
  { type: 'action', instruction: 'click the "Sign in" button' },
  { type: 'wait', instruction: 'the URL contains "/home"' },
  { type: 'assertion', instruction: 'the welcome banner is showing' },
  { type: 'agent', instruction: 'open settings' },
];

function script() {
  return decode(
    createAgenticJourneyCheck(new URL('https://grafana.com/'), steps, 'anthropic-key').settings.browser.script
  );
}

it('maps each step type to the matching k6-browser-ai call, in order', () => {
  const code = script();
  const calls = [
    'await page.ai.act("click the \\"Sign in\\" button");',
    'await page.ai.wait("the URL contains \\"/home\\"", { timeout: 10000 });',
    'await page.ai.assert("the welcome banner is showing");',
    'await page.ai.agent("open settings", { maxSteps: 15 });',
  ].map((call) => code.indexOf(call));
  expect(calls.every((index) => index >= 0)).toBe(true);
  expect([...calls].sort((a, b) => a - b)).toEqual(calls);
});

it('escapes instructions so they cannot break out of the string literal', () => {
  const code = decode(
    createAgenticJourneyCheck(
      new URL('https://grafana.com/'),
      [{ type: 'action', instruction: '");process.exit();("' }],
      'anthropic-key'
    ).settings.browser.script
  );
  expect(code).toContain('page.ai.act("\\");process.exit();(\\"")');
});

it('names the check after the start URL', () => {
  const check = createAgenticJourneyCheck(new URL('https://grafana.com/'), steps, 'anthropic-key');
  expect(check.job).toBe('Agentic journey on https://grafana.com/');
  expect(check.target).toBe('https://grafana.com/');
});

it('reads the Anthropic API key from the selected secret', () => {
  const code = decode(
    createAgenticJourneyCheck(new URL('https://grafana.com/'), steps, 'my-key').settings.browser.script
  );
  expect(code).toContain("import secrets from 'k6/secrets';");
  expect(code).toContain('await secrets.get("my-key")');
});

it('uses the provided name for the check, trimmed', () => {
  const check = createAgenticJourneyCheck(new URL('https://grafana.com/'), steps, 'anthropic-key', '  Checkout flow ');
  expect(check.job).toBe('Checkout flow');
});

it('falls back to the default name when the name is blank', () => {
  const check = createAgenticJourneyCheck(new URL('https://grafana.com/'), steps, 'anthropic-key', '   ');
  expect(check.job).toBe('Agentic journey on https://grafana.com/');
});
