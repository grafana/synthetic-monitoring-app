import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAppPluginInstalled } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { render } from 'test/render';
import { server } from 'test/server';
import { testUsesCombobox } from 'test/utils';

import { CheckFormValues, Label } from 'types';

import { KnowledgeGraphServiceLink } from './KnowledgeGraphServiceLink';

const KG_API_BASE = '/api/plugins/grafana-asserts-app/resources/asserts/api-server';
const PROPERTY_VALUES_URL = `${KG_API_BASE}/v1/entity_type/property_values`;
const ENTITY_SEARCH_URL = `${KG_API_BASE}/v1/search`;
const EXPAND_BUTTON = 'Service link';
const REMOVE_BUTTON = 'Remove service link';

const mockUseAppPluginInstalled = useAppPluginInstalled as jest.Mock;

function setKgInstalled(value: boolean) {
  mockUseAppPluginInstalled.mockReturnValue({ loading: false, error: undefined, value });
}

interface MockKgApiOptions {
  names?: string[];
  namespaces?: string[];
  matchingServices?: Array<{ name: string; namespace?: string }>;
}

function mockKgApi({ names = [], namespaces = [], matchingServices = [] }: MockKgApiOptions) {
  server.use(
    http.post(PROPERTY_VALUES_URL, async ({ request }) => {
      const body = (await request.json()) as { propertyName?: string };
      const values = body?.propertyName === 'namespace' ? namespaces : names;
      return HttpResponse.json({ values });
    }),
    http.post(ENTITY_SEARCH_URL, async ({ request }) => {
      const body = (await request.json()) as {
        filterCriteria?: Array<{ propertyMatchers?: Array<{ op?: string; value?: string }> }>;
      };
      const requestedName = body?.filterCriteria?.[0]?.propertyMatchers?.find((m) => m.op === '=')?.value;
      const entities = matchingServices
        .filter((service) => service.name === requestedName)
        .map((service) => ({ name: service.name, scope: { namespace: service.namespace } }));
      return HttpResponse.json({ data: { entities } });
    })
  );
}

interface RenderOptions {
  labels?: Label[];
  calLabels?: Label[];
}

function renderServiceLink({ labels = [], calLabels = [] }: RenderOptions = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const form = useForm<CheckFormValues>({ defaultValues: { labels, calLabels } });

    return (
      <FormProvider {...form}>
        {children}
        <div data-testid="labels-output">{JSON.stringify(form.watch('labels'))}</div>
        <div data-testid="cal-labels-output">{JSON.stringify(form.watch('calLabels'))}</div>
      </FormProvider>
    );
  };

  return render(
    <Wrapper>
      <KnowledgeGraphServiceLink />
    </Wrapper>
  );
}

beforeEach(() => {
  testUsesCombobox();
});

it(`renders nothing when the Knowledge Graph app is not installed`, async () => {
  setKgInstalled(false);
  renderServiceLink();

  expect(screen.queryByText('Link to Knowledge Graph service')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: EXPAND_BUTTON })).not.toBeInTheDocument();
});

it(`starts collapsed with an expand button when no service link labels are set`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'] });
  renderServiceLink();

  expect(await screen.findByRole('button', { name: EXPAND_BUTTON })).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Select or type a service name')).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Select or type a namespace')).not.toBeInTheDocument();
});

it(`reveals the service link fields when expanded`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink();

  await user.click(await screen.findByRole('button', { name: EXPAND_BUTTON }));

  expect(await screen.findByPlaceholderText('Select or type a service name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Select or type a namespace')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: EXPAND_BUTTON })).not.toBeInTheDocument();
});

it(`starts expanded and pre-populates the fields from existing service_name / namespace labels`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'] });
  renderServiceLink({
    labels: [
      { name: 'service_name', value: 'frontend' },
      { name: 'namespace', value: 'otel-demo' },
    ],
  });

  expect(await screen.findByDisplayValue('frontend')).toBeInTheDocument();
  expect(screen.getByDisplayValue('otel-demo')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: EXPAND_BUTTON })).not.toBeInTheDocument();
});

it(`writes service_name and namespace into the check labels when a service is selected`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend', 'cartservice'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink();

  await user.click(await screen.findByRole('button', { name: EXPAND_BUTTON }));

  const serviceInput = await screen.findByPlaceholderText('Select or type a service name');
  await user.click(serviceInput);
  await user.click(await screen.findByRole('option', { name: 'frontend' }));

  await waitFor(() => {
    expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"service_name","value":"frontend"');
  });

  const namespaceInput = screen.getByPlaceholderText('Select or type a namespace');
  await user.click(namespaceInput);
  await user.click(await screen.findByRole('option', { name: 'otel-demo' }));

  await waitFor(() => {
    expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"namespace","value":"otel-demo"');
  });
});

it(`writes to calLabels instead of labels when service_name is a cost attribution label`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink({ calLabels: [{ name: 'service_name', value: '' }] });

  await user.click(await screen.findByRole('button', { name: EXPAND_BUTTON }));

  // the CAL-managed field is marked as such
  expect(await screen.findByText('Also a cost attribution label')).toBeInTheDocument();

  const serviceInput = await screen.findByPlaceholderText('Select or type a service name');
  await user.click(serviceInput);
  await user.click(await screen.findByRole('option', { name: 'frontend' }));

  await waitFor(() => {
    expect(screen.getByTestId('cal-labels-output')).toHaveTextContent('"name":"service_name","value":"frontend"');
  });
  expect(screen.getByTestId('labels-output')).not.toHaveTextContent('service_name');
});

it(`clears the labels and collapses when the service link is removed`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink({
    labels: [
      { name: 'service_name', value: 'frontend' },
      { name: 'namespace', value: 'otel-demo' },
      { name: 'team', value: 'sm' },
    ],
  });

  await user.click(await screen.findByRole('button', { name: REMOVE_BUTTON }));

  await waitFor(() => {
    const output = screen.getByTestId('labels-output').textContent ?? '';
    expect(output).not.toContain('service_name');
    expect(output).not.toContain('namespace');
  });
  // unrelated labels are preserved and the section collapses back to the expand button
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"team","value":"sm"');
  expect(screen.getByRole('button', { name: EXPAND_BUTTON })).toBeInTheDocument();
});

it(`keeps the CAL row (with an empty value) when a CAL-managed service link is removed`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink({
    calLabels: [{ name: 'service_name', value: 'frontend' }],
    labels: [{ name: 'namespace', value: 'otel-demo' }],
  });

  await user.click(await screen.findByRole('button', { name: REMOVE_BUTTON }));

  await waitFor(() => {
    expect(screen.getByTestId('cal-labels-output')).toHaveTextContent('"name":"service_name","value":""');
  });
  expect(screen.getByTestId('labels-output')).not.toHaveTextContent('namespace');
});

it(`shows a confirmation when the selected service exists in the Knowledge Graph`, async () => {
  setKgInstalled(true);
  mockKgApi({
    names: ['frontend'],
    namespaces: ['otel-demo'],
    matchingServices: [{ name: 'frontend', namespace: 'otel-demo' }],
  });
  renderServiceLink({
    labels: [
      { name: 'service_name', value: 'frontend' },
      { name: 'namespace', value: 'otel-demo' },
    ],
  });

  expect(await screen.findByText(/Will link to service frontend \(namespace otel-demo\)/)).toBeInTheDocument();
});

it(`shows a hint when no matching service exists in the Knowledge Graph yet`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'], matchingServices: [] });
  renderServiceLink({ labels: [{ name: 'service_name', value: 'my-new-service' }] });

  expect(await screen.findByText(/No matching service in the Knowledge Graph yet/)).toBeInTheDocument();
});

it(`treats a namespace mismatch as no match`, async () => {
  setKgInstalled(true);
  mockKgApi({
    names: ['frontend'],
    namespaces: ['otel-demo'],
    matchingServices: [{ name: 'frontend', namespace: 'other-namespace' }],
  });
  renderServiceLink({
    labels: [
      { name: 'service_name', value: 'frontend' },
      { name: 'namespace', value: 'otel-demo' },
    ],
  });

  expect(await screen.findByText(/No matching service in the Knowledge Graph yet/)).toBeInTheDocument();
});
