import { AGENTIC_URLS, K6_URLS, SM_URLS } from './TestingAndSyntheticsLandingPage.constants';

it('uses generic k6 performance entry routes', () => {
  expect(K6_URLS.projects).toBe('/a/k6-app/projects');
  expect(K6_URLS.home).toBe('/a/k6-app');
});

it('uses agentic testing app routes', () => {
  expect(AGENTIC_URLS.home).toBe('/a/grafana-agentictesting-app');
  expect(AGENTIC_URLS.create).toBe('/a/grafana-agentictesting-app/create');
});

it('uses stable SM routes', () => {
  expect(SM_URLS.chooseCheck).toMatch(/checks\/choose-type$/);
  expect(SM_URLS.terraform).toMatch(/config\/terraform$/);
});
