import React from 'react';
import { config, locationService } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { trackCheckTemplateDraftCreated, trackCheckTemplateSelected } from 'features/tracking/checkTemplateEvents';
import { decode } from 'js-base64';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsHGFreeUserOverLimit, runTestAsViewer } from 'test/utils';

import { BrowserCheck, CheckType, FeatureName } from 'types';
import { DEFAULT_CHECK_CONFIG_MAP } from 'components/Checkster/constants';

import { CheckTemplate } from './components/CheckTemplate';
import { ChooseCheckGroup } from './ChooseCheckGroup';

jest.mock('features/tracking/checkTemplateEvents');

it('uses the template check type for the badge, destination, and draft', async () => {
  const { user } = render(
    <CheckTemplate template={{
      id: 'ssl_certificate',
      title: 'HTTP template',
      icon: 'lock',
      description: 'An HTTP template',
      urlDescription: 'Enter a URL.',
      checkType: CheckType.Http,
      createCheck: (url) => ({
        ...DEFAULT_CHECK_CONFIG_MAP[CheckType.Http],
        job: 'HTTP template',
        target: url.href,
      }),
    }} />
  );

  await user.click(await screen.findByRole('button', { name: 'HTTP template' }));
  expect(screen.getByText('HTTP')).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  expect(locationService.getLocation()).toMatchObject({
    pathname: '/a/grafana-synthetic-monitoring-app/checks/new/api-endpoint',
    search: '?checkType=http',
    state: { prefilledCheck: {
      target: 'https://grafana.com/',
      settings: DEFAULT_CHECK_CONFIG_MAP[CheckType.Http].settings,
    } },
  });
});

async function renderChooseCheckGroup({ checkLimit = 10, scriptedLimit = 10 } = {}) {
  server.use(
    apiRoute('getTenantLimits', {
      result: () => ({
        json: {
          MaxChecks: checkLimit,
          MaxScriptedChecks: scriptedLimit,
          MaxMetricLabels: 16,
          MaxLogLabels: 13,
          maxAllowedMetricLabels: 10,
          maxAllowedLogLabels: 5,
        },
      }),
    })
  );
  const res = render(<ChooseCheckGroup />);
  await screen.findByText('Choose a check type');

  return res;
}

it('shows check type options correctly', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: false });
  await renderChooseCheckGroup();

  expect(screen.queryByRole('link', { name: `API Endpoint` })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Multi Step` })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Scripted` })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: `Browser` })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Detect broken links' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Check SSL certificate' })).not.toBeInTheDocument();
});

it.each([
  { title: 'Detect broken links', id: 'broken_links', job: 'Broken links on test.k6.io', error: 'Enter a valid URL starting with https:// or http://.' },
  { title: 'Check SSL certificate', id: 'ssl_certificate', job: 'SSL certificate for test.k6.io', error: 'Enter a valid URL starting with https://.' },
])('validates $title and opens a browser check draft', async ({ title, id, job, error }) => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  const { user } = await renderChooseCheckGroup();
  const template = await screen.findByRole('button', { name: title });
  await waitFor(() => expect(template).toBeEnabled());
  await user.click(template);
  expect(trackCheckTemplateSelected).toHaveBeenCalledTimes(1);
  expect(trackCheckTemplateSelected).toHaveBeenCalledWith({ check_template_id: id });

  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText(error)).toBeInTheDocument();
  expect(trackCheckTemplateDraftCreated).not.toHaveBeenCalled();

  const input = screen.getByRole('textbox', { name: /^Page URL/ });
  await user.type(input, id === 'ssl_certificate' ? 'http://example.com' : 'ftp://example.com');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText(error)).toBeInTheDocument();

  await user.clear(input);
  await user.type(input, 'https://test.k6.io/');
  await user.click(screen.getByRole('button', { name: 'Continue' }));

  const location = locationService.getLocation();
  expect(trackCheckTemplateDraftCreated).toHaveBeenCalledTimes(1);
  expect(trackCheckTemplateDraftCreated).toHaveBeenCalledWith({ check_template_id: id });
  expect(location.state).toMatchObject({ checkTemplateId: id });
  expect(location.pathname).toBe('/a/grafana-synthetic-monitoring-app/checks/new/browser');
  const { prefilledCheck } = location.state as { prefilledCheck: BrowserCheck };
  expect(prefilledCheck.job).toBe(job);
  expect(prefilledCheck.target).toBe('https://test.k6.io/');
  const script = decode(prefilledCheck.settings.browser.script);
  expect(prefilledCheck.frequency).toBe(60 * 60 * 1000);
  if (id === 'ssl_certificate') {
    expect(script).toContain("import sslcheck from 'https://jslib.k6.io/sm-sslcheck/0.1.0/index.js';");
    expect(script).toContain('const res = await page.goto("https://test.k6.io/");');
    expect(script).toContain('await sslcheck.checkCertificate(res, { warnDays: 30, failOnExpired: true, failOnNearExpiry: true });');
  } else {
    expect(script).toContain('await page.goto("https://test.k6.io/", { waitUntil: \'load\' });');
    expect(script).toContain('await checkLinks(page);');
  }
  expect(script).toContain('await page.close();');
});

it('disables the template when the check limit is reached', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  await renderChooseCheckGroup({ checkLimit: 1 });
  await screen.findByText(/You have reached your check limit of /);
  expect(screen.getByRole('group', { name: 'Detect broken links' })).toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('group', { name: 'Check SSL certificate' })).toHaveAttribute('aria-disabled', 'true');
});

it('disables the template for viewers', async () => {
  mockFeatureToggles({ [FeatureName.CheckTemplates]: true });
  runTestAsViewer();
  await renderChooseCheckGroup();
  expect(await screen.findByRole('group', { name: 'Detect broken links' })).toHaveAttribute('aria-disabled', 'true');
});

it(`doesn't show gRPC option by default`, async () => {
  await renderChooseCheckGroup();
  expect(screen.queryByText('gRPC')).not.toBeInTheDocument();
});

it('shows gRPC option when feature is enabled', async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.GRPCChecks]: true,
  });

  await renderChooseCheckGroup();
  expect(screen.getByText('gRPC')).toBeInTheDocument();
});

it('shows error alert when check limit is reached', async () => {
  await renderChooseCheckGroup({ checkLimit: 1 });
  const limitError = await screen.findByText(/You have reached your check limit of /);
  expect(limitError).toBeInTheDocument();
});

it(`shows an error alert when user is HG Free user with over 100k execution limit`, async () => {
  runTestAsHGFreeUserOverLimit();

  await renderChooseCheckGroup();
  const alert = await screen.findByText(/You have reached your monthly execution limit of/);
  expect(alert).toBeInTheDocument();

  const apiEndPointButton = screen.getByRole('link', { name: `API Endpoint` });
  const multiStepButton = screen.getByRole('link', { name: `Multi Step` });
  const scriptedButton = screen.getByRole('link', { name: `Scripted` });
  const browserButton = screen.getByRole('link', { name: `Browser` });

  expect(apiEndPointButton).toHaveAttribute(`aria-disabled`, `true`);
  expect(multiStepButton).toHaveAttribute(`aria-disabled`, `true`);
  expect(scriptedButton).toHaveAttribute(`aria-disabled`, `true`);
  expect(browserButton).toHaveAttribute(`aria-disabled`, `true`);
});
