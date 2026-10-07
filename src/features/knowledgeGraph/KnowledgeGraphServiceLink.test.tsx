import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAppPluginInstalled } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { KG_FRONTEND_APPS } from 'test/fixtures/knowledgeGraph';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, testUsesCombobox } from 'test/utils';

import { CheckFormValues, FeatureName, Label } from 'types';

import { KnowledgeGraphServiceLink } from './KnowledgeGraphServiceLink';

const KG_API_BASE = '/api/plugins/grafana-asserts-app/resources/asserts/api-server';
const PROPERTY_VALUES_URL = `${KG_API_BASE}/v1/entity_type/property_values`;
const ENTITY_SEARCH_URL = `${KG_API_BASE}/v1/search`;

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
      return HttpResponse.json({ data: { entities, lastPage: true } });
    })
  );
}

interface RenderOptions {
  labels?: Label[];
}

function renderServiceLink({ labels = [] }: RenderOptions = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const form = useForm<CheckFormValues>({ defaultValues: { labels, calLabels: [] } });

    return (
      <FormProvider {...form}>
        {children}
        <div data-testid="labels-output">{JSON.stringify(form.watch('labels'))}</div>
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
  setKgInstalled(true);
});

it(`renders nothing when the Knowledge Graph app is not installed`, async () => {
  setKgInstalled(false);
  renderServiceLink();

  expect(screen.queryByText('Knowledge Graph connections')).not.toBeInTheDocument();
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
  expect(screen.getByRole('combobox', { name: 'Frontend application' })).toBeInTheDocument();
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

it('preserves an unavailable frontend app ID and lets the user clear it', async () => {
  const { user } = renderServiceLink({ labels: [{ name: 'feo11y_app_id', value: '999' }] });

  expect(await screen.findByText('No matching frontend in Knowledge Graph yet.')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveValue('App ID 999');
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":"999"');
  await user.click(screen.getByRole('button', { name: 'Clear frontend connection' }));
  expect(screen.getByTestId('labels-output')).toHaveTextContent('[]');
});

it('preserves the frontend on lookup failure, supports retry, and allows clearing during an error', async () => {
  server.use(apiRoute('searchKnowledgeGraphEntities', { result: () => ({ status: 500 }) }));
  const { user } = renderServiceLink({ labels: [{ name: 'feo11y_app_id', value: '229' }] });

  expect(await screen.findByText(/Could not load frontend applications/)).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveValue('App ID 229');
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":"229"');
  await user.click(screen.getByRole('button', { name: 'Clear frontend connection' }));
  expect(screen.getByTestId('labels-output')).toHaveTextContent('[]');

  server.use(apiRoute('searchKnowledgeGraphEntities'));
  await user.click(screen.getByRole('button', { name: 'Retry' }));
  const input = screen.getByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await user.click(input);
  expect(await screen.findByRole('option', { name: /banking · production/ })).toBeInTheDocument();
});

it('explains when no frontend applications have been discovered', async () => {
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: () => ({ json: { data: { entities: [], lastPage: true } } }),
    })
  );
  renderServiceLink();

  expect(await screen.findByText('No frontend applications discovered in Knowledge Graph yet.')).toBeInTheDocument();
});

it('combines a frontend across paginated environments and explains its scope', async () => {
  const banking = KG_FRONTEND_APPS[0];
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: async (request) => {
        const { pageNum } = await request.json();
        return {
          json: {
            data: {
              entities: pageNum === 0 ? [banking] : [{ ...banking, scope: { env: 'staging' } }],
              lastPage: pageNum !== 0,
            },
          },
        };
      },
    })
  );
  const { user } = renderServiceLink();

  const input = await screen.findByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await user.click(input);
  expect(await screen.findAllByRole('option')).toHaveLength(1);
  await user.click(screen.getByRole('option', { name: /banking · production · staging/ }));
  expect(
    screen.getByText('This connection includes all listed environments for this application.')
  ).toBeInTheDocument();
});
