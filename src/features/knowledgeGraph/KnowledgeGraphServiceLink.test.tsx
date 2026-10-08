import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAppPluginInstalled } from '@grafana/runtime';
import { act, screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { KG_FRONTEND_APPS } from 'test/fixtures/knowledgeGraph';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, testUsesCombobox } from 'test/utils';

import { CheckFormValues, FeatureName, Label } from 'types';
import { toFormValues } from 'components/Checkster/utils/adaptors';

import { addConnection } from './__testHelpers__/connections';
import { KnowledgeGraphServiceLink } from './KnowledgeGraphServiceLink';

const CUSTOM_LABEL: Label = { name: 'app', value: 'banking' };

interface RenderOptions {
  labels?: Label[];
  loadedLabels?: Promise<Label[]>;
}

function renderServiceLink({ labels = [], loadedLabels }: RenderOptions = {}) {
  const defaultValues = { ...toFormValues(BASIC_HTTP_CHECK), labels, calLabels: [] };
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const form = useForm<CheckFormValues>({
      defaultValues: loadedLabels ? async () => ({ ...defaultValues, labels: await loadedLabels }) : defaultValues,
    });

    return (
      <FormProvider {...form}>
        {children}
        <div data-testid="labels-output">{JSON.stringify(form.watch('labels'))}</div>
        <button type="button" disabled={!form.formState.isDirty}>
          Save labels
        </button>
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
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true, [FeatureName.KnowledgeGraphFrontend]: true });
  (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: true });
});

it('renders nothing when the Knowledge Graph app is not installed', async () => {
  (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: false });
  renderServiceLink();
  expect(screen.queryByText('Knowledge Graph connections')).not.toBeInTheDocument();
});

it('renders nothing when the feature flag is disabled', async () => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: false });
  renderServiceLink();
  expect(screen.queryByText('Knowledge Graph connections')).not.toBeInTheDocument();
});

it('adds, removes, and re-adds each empty connection without changing labels or dirtying the form', async () => {
  const { user } = renderServiceLink({ labels: [CUSTOM_LABEL] });
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

  await addConnection(user, 'Frontend application');
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveFocus());
  await user.click(screen.getByRole('button', { name: 'Add connection' }));
  expect(screen.queryByRole('menuitem', { name: 'Frontend application' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('menuitem', { name: 'Service' }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Service name' })).toHaveFocus());
  expect(screen.getByRole('combobox', { name: 'Namespace' })).toHaveValue('Any namespace');
  expect(screen.queryByRole('button', { name: 'Add connection' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save labels' })).toBeDisabled();

  for (const type of ['Service', 'Frontend application'] as const) {
    await user.click(screen.getByRole('button', { name: `Remove ${type.toLowerCase()} connection` }));
    expect(screen.queryByRole('group', { name: type })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add connection' })).toHaveFocus());
    expect(screen.getByRole('button', { name: 'Save labels' })).toBeDisabled();
    await addConnection(user, type);
    expect(screen.getByRole('group', { name: type })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save labels' })).toBeDisabled();
  }
  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify([CUSTOM_LABEL]));
});

it('restores asynchronously loaded connections, including a namespace-only service', async () => {
  let resolveLabels!: (labels: Label[]) => void;
  const loadedLabels = new Promise<Label[]>((resolve) => {
    resolveLabels = resolve;
  });
  renderServiceLink({ loadedLabels });
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

  await act(async () => {
    resolveLabels([
      { name: 'namespace', value: 'banking-prod' },
      { name: 'feo11y_app_id', value: '229' },
    ]);
  });

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Namespace' })).toHaveValue('banking-prod');
  expect(screen.getByRole('combobox', { name: 'Service name' })).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Save labels' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Add connection' })).not.toBeInTheDocument();
});

it('writes service_name and namespace when a service is selected', async () => {
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: () => ({ json: { data: { entities: [{ name: 'frontend', scope: { namespace: 'otel-demo' } }] } } }),
    }),
    apiRoute('getKnowledgeGraphPropertyValues', {
      result: async (request) => {
        const { propertyName } = await request.json();
        return { json: { values: propertyName === 'namespace' ? ['otel-demo'] : ['frontend'] } };
      },
    })
  );
  const { user } = renderServiceLink();
  await addConnection(user, 'Service');
  await user.click(screen.getByRole('combobox', { name: 'Service name' }));
  await user.click(await screen.findByRole('option', { name: 'frontend' }));
  await user.click(screen.getByRole('combobox', { name: 'Namespace' }));
  await user.click(await screen.findByRole('option', { name: 'otel-demo' }));
  expect(screen.getByTestId('labels-output')).toHaveTextContent(
    JSON.stringify([
      { name: 'service_name', value: 'frontend' },
      { name: 'namespace', value: 'otel-demo' },
    ])
  );
  expect(screen.getByRole('button', { name: 'Save labels' })).toBeEnabled();
  expect(
    await screen.findByText('Will link to service frontend (namespace otel-demo) in the Knowledge Graph.')
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Remove service connection' }));
  expect(screen.queryByText(/Will link to service/)).not.toBeInTheDocument();
});

it('shows a hint when the saved service is not discovered', async () => {
  renderServiceLink({ labels: [{ name: 'service_name', value: 'my-new-service' }] });
  expect(await screen.findByText(/No matching service in the Knowledge Graph yet/)).toBeInTheDocument();
  expect(screen.queryByText(/Will link to service/)).not.toBeInTheDocument();
});

it('treats a namespace mismatch as no match', async () => {
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: () => ({ json: { data: { entities: [{ name: 'frontend', scope: { namespace: 'other-namespace' } }] } } }),
    })
  );
  renderServiceLink({
    labels: [
      { name: 'service_name', value: 'frontend' },
      { name: 'namespace', value: 'otel-demo' },
    ],
  });
  expect(await screen.findByText(/No matching service in the Knowledge Graph yet/)).toBeInTheDocument();
  expect(screen.queryByText(/Will link to service/)).not.toBeInTheDocument();
});

it('preserves an unavailable frontend app ID and lets the user remove it', async () => {
  const { user } = renderServiceLink({ labels: [{ name: 'feo11y_app_id', value: '999' }] });
  expect(await screen.findByText('No matching frontend in Knowledge Graph yet.')).toBeInTheDocument();
  expect(screen.queryByText(/Will link to frontend application/)).not.toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveValue('App ID 999');
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":"999"');
  await user.click(screen.getByRole('button', { name: 'Remove frontend application connection' }));
  expect(screen.queryByRole('group', { name: 'Frontend application' })).not.toBeInTheDocument();
  expect(screen.getByTestId('labels-output')).toHaveTextContent('[]');
});

it('preserves frontend values on lookup failure, allows removal, and supports retry after re-adding', async () => {
  server.use(apiRoute('searchKnowledgeGraphEntities', { result: () => ({ status: 500 }) }));
  const { user } = renderServiceLink({ labels: [{ name: 'feo11y_app_id', value: '229' }] });
  expect(await screen.findByText(/Could not load frontend applications/)).toBeInTheDocument();
  expect(screen.queryByText(/Will link to frontend application/)).not.toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveValue('App ID 229');
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":"229"');
  await user.click(screen.getByRole('button', { name: 'Remove frontend application connection' }));
  expect(screen.getByTestId('labels-output')).toHaveTextContent('[]');

  await addConnection(user, 'Frontend application');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus());
  server.use(apiRoute('searchKnowledgeGraphEntities'));
  await user.click(screen.getByRole('button', { name: 'Retry' }));
  const input = screen.getByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /banking · production/ }));
  expect(
    await screen.findByText('Will link to frontend application banking in the Knowledge Graph.')
  ).toBeInTheDocument();
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":"229"');
});

it.each([false, true])('handles delayed frontend focus without stealing it (leave row: %s)', async (leaveRow) => {
  let resolveApps!: () => void;
  const appsReady = new Promise<void>((resolve) => {
    resolveApps = resolve;
  });
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: async () => {
        await appsReady;
        return { json: { data: { entities: KG_FRONTEND_APPS, lastPage: true } } };
      },
    })
  );
  const { user } = renderServiceLink();
  await addConnection(user, 'Frontend application');
  await waitFor(() => expect(screen.getByRole('group', { name: 'Frontend application' })).toHaveFocus());
  if (leaveRow) {
    await user.click(screen.getByRole('button', { name: 'Add connection' }));
    await user.keyboard('{Escape}');
  }
  resolveApps();
  const input = screen.getByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await waitFor(() => expect(leaveRow ? screen.getByRole('button', { name: 'Add connection' }) : input).toHaveFocus());
});

it('explains when no frontend applications have been discovered', async () => {
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: () => ({ json: { data: { entities: [], lastPage: true } } }),
    })
  );
  const { user } = renderServiceLink();
  await addConnection(user, 'Frontend application');
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
  await addConnection(user, 'Frontend application');
  const input = screen.getByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await user.click(input);
  expect(await screen.findAllByRole('option')).toHaveLength(1);
  await user.click(screen.getByRole('option', { name: /banking · production · staging/ }));
  expect(
    screen.getByText('This connection includes all listed environments for this application.')
  ).toBeInTheDocument();
});

it('keeps Service setup available and preserves saved Frontend labels when the Frontend flag is off', async () => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true, [FeatureName.KnowledgeGraphFrontend]: false });
  const labels = [{ name: 'feo11y_app_id', value: '229' }];
  const { user } = renderServiceLink({ labels });
  expect(screen.queryByRole('combobox', { name: 'Frontend application' })).not.toBeInTheDocument();
  await user.click(await screen.findByRole('button', { name: 'Add connection' }));
  expect(screen.queryByRole('menuitem', { name: 'Frontend application' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('menuitem', { name: 'Service' }));
  expect(screen.getByRole('combobox', { name: 'Service name' })).toBeInTheDocument();
  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify(labels));
});
