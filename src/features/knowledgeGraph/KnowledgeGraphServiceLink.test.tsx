import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAppPluginInstalled } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, testUsesCombobox } from 'test/utils';

import { CheckFormValues, FeatureName, Label } from 'types';

import { KnowledgeGraphServiceLink } from './KnowledgeGraphServiceLink';

const KG_API_BASE = '/api/plugins/grafana-asserts-app/resources/asserts/api-server';
const PROPERTY_VALUES_URL = `${KG_API_BASE}/v1/entity_type/property_values`;
const ENTITY_SEARCH_URL = `${KG_API_BASE}/v1/search`;
const CLEAR_ICON = 'times';

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
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
});

it(`renders nothing when the Knowledge Graph app is not installed`, async () => {
  setKgInstalled(false);
  renderServiceLink();

  expect(screen.queryByText('Link to Knowledge Graph service')).not.toBeInTheDocument();
});

it(`renders nothing when the feature flag is disabled, even with the app installed`, async () => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: false });
  setKgInstalled(true);
  renderServiceLink();

  expect(screen.queryByPlaceholderText('Select or type a service name')).not.toBeInTheDocument();
});

it(`shows the service link fields directly, with no expand or remove actions`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'] });
  renderServiceLink();

  expect(await screen.findByPlaceholderText('Select or type a service name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Select or type a namespace')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Service link' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Remove service link' })).not.toBeInTheDocument();
});

it(`pre-populates the fields from existing service_name / namespace labels`, async () => {
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
});

it(`writes service_name and namespace into the check labels when a service is selected`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend', 'cartservice'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink();

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

  const serviceInput = await screen.findByPlaceholderText('Select or type a service name');
  await user.click(serviceInput);
  await user.click(await screen.findByRole('option', { name: 'frontend' }));

  await waitFor(() => {
    expect(screen.getByTestId('cal-labels-output')).toHaveTextContent('"name":"service_name","value":"frontend"');
  });
  expect(screen.getByTestId('labels-output')).not.toHaveTextContent('service_name');
});

it(`offers a clearable combobox per row as the only way to unset a value`, async () => {
  setKgInstalled(true);
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'] });
  renderServiceLink({
    labels: [
      { name: 'service_name', value: 'frontend' },
      { name: 'namespace', value: 'otel-demo' },
    ],
  });

  expect(await screen.findByDisplayValue('frontend')).toBeInTheDocument();
  // the combobox clear affordance (its click handler is not wired up under the test's
  // inline-svg mock, so what clearing does to the labels is covered in the hooks test)
  expect(screen.getAllByTestId(CLEAR_ICON)).toHaveLength(2);
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
