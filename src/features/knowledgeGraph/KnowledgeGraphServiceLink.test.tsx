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

import { KnowledgeGraphServiceLink } from './KnowledgeGraphServiceLink';

const mockUseAppPluginInstalled = useAppPluginInstalled as jest.Mock;
const SERVICE_LABELS: Label[] = [
  { name: 'service_name', value: 'frontend' },
  { name: 'namespace', value: 'otel-demo' },
];
const FRONTEND_LABEL: Label = { name: 'feo11y_app_id', value: '229' };
const CUSTOM_LABEL: Label = { name: 'app', value: 'banking' };

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
    apiRoute('getKnowledgeGraphPropertyValues', {
      result: async (request) => {
        const body = await request.json();
        return { json: { values: body.propertyName === 'namespace' ? namespaces : names } };
      },
    }),
    apiRoute('searchKnowledgeGraphEntities', {
      result: async (request) => {
        const body = await request.json();
        const criteria = body.filterCriteria?.[0];
        if (criteria?.entityType === 'Frontend') {
          return { json: { data: { entities: KG_FRONTEND_APPS, lastPage: true } } };
        }
        const requestedName = criteria?.propertyMatchers?.find((m: { op?: string }) => m.op === '=')?.value;
        const entities = matchingServices
          .filter((service) => service.name === requestedName)
          .map((service) => ({ name: service.name, scope: { namespace: service.namespace } }));
        return { json: { data: { entities } } };
      },
    })
  );
}

interface RenderOptions {
  labels?: Label[];
  calLabels?: Label[];
  disabled?: boolean;
  loadedLabels?: Promise<Label[]>;
}

function renderServiceLink({ labels = [], calLabels = [], disabled = false, loadedLabels }: RenderOptions = {}) {
  const defaultValues = { ...toFormValues(BASIC_HTTP_CHECK), labels, calLabels };
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const form = useForm<CheckFormValues>({
      defaultValues: loadedLabels ? async () => ({ ...defaultValues, labels: await loadedLabels }) : defaultValues,
      disabled,
    });

    return (
      <FormProvider {...form}>
        {children}
        <div data-testid="labels-output">{JSON.stringify(form.watch('labels'))}</div>
        <div data-testid="cal-labels-output">{JSON.stringify(form.watch('calLabels'))}</div>
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

async function addConnection(user: ReturnType<typeof render>['user'], type: 'Service' | 'Frontend application') {
  await user.click(await screen.findByRole('button', { name: 'Add connection' }));
  await user.click(await screen.findByRole('menuitem', { name: new RegExp(`^${type}`) }));
}

beforeEach(() => {
  testUsesCombobox();
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
  setKgInstalled(true);
});

it('renders nothing when the Knowledge Graph app is not installed', async () => {
  setKgInstalled(false);
  renderServiceLink();

  expect(screen.queryByText('Knowledge Graph connections')).not.toBeInTheDocument();
});

it('renders nothing when the feature flag is disabled, even with the app installed', async () => {
  mockFeatureToggles({ [FeatureName.KnowledgeGraph]: false });
  renderServiceLink();

  expect(screen.queryByText('Knowledge Graph connections')).not.toBeInTheDocument();
});

it('adds, removes, and re-adds draft connections without changing labels or dirtying the form', async () => {
  const { user } = renderServiceLink({ labels: [CUSTOM_LABEL] });

  expect(await screen.findByText('No connections added.')).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.getAllByText('Changes apply after saving and may take a few minutes to appear.')).toHaveLength(1);

  await addConnection(user, 'Service');
  expect(screen.getByRole('combobox', { name: 'Service name' })).toHaveValue('');
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Service name' })).toHaveFocus());
  expect(screen.getByRole('combobox', { name: 'Namespace' })).toHaveValue('');
  expect(screen.queryByText('No connections added.')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save labels' })).toBeDisabled();

  await user.click(await screen.findByRole('button', { name: 'Add connection' }));
  expect(screen.queryByRole('menuitem', { name: /^Service/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('menuitem', { name: /^Frontend application/ }));
  expect(await screen.findByRole('combobox', { name: 'Frontend application' })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveFocus());
  expect(screen.queryByRole('button', { name: 'Add connection' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save labels' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: 'Remove service connection' }));
  expect(screen.queryByRole('combobox', { name: 'Service name' })).not.toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Frontend application' })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add connection' })).toHaveFocus());
  await user.click(screen.getByRole('button', { name: 'Remove frontend connection' }));
  expect(screen.getByText('No connections added.')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add connection' })).toHaveFocus());
  expect(screen.getByRole('button', { name: 'Save labels' })).toBeDisabled();

  await addConnection(user, 'Frontend application');
  expect(await screen.findByRole('combobox', { name: 'Frontend application' })).toHaveValue('');
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveFocus());
  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify([CUSTOM_LABEL]));
  expect(screen.getByRole('button', { name: 'Save labels' })).toBeDisabled();
});

it('shows only the saved frontend and offers the missing service connection', async () => {
  const { user } = renderServiceLink({ labels: [FRONTEND_LABEL] });

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Service name' })).not.toBeInTheDocument();
  expect(screen.queryByText(/Matching frontend found/)).not.toBeInTheDocument();
  await user.click(await screen.findByRole('button', { name: 'Add connection' }));
  expect(screen.getByRole('menuitem', { name: /^Service/ })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: /^Frontend application/ })).not.toBeInTheDocument();
});

it('shows saved service fields, including a connection configured only with a namespace', async () => {
  renderServiceLink({ labels: [{ name: 'namespace', value: 'otel-demo' }] });

  expect(await screen.findByRole('combobox', { name: 'Namespace' })).toHaveValue('otel-demo');
  expect(screen.getByRole('combobox', { name: 'Service name' })).toHaveValue('');
  expect(screen.queryByRole('combobox', { name: 'Frontend application' })).not.toBeInTheDocument();
});

it('restores connections when saved labels finish loading after the section mounts', async () => {
  let resolveLabels!: (labels: Label[]) => void;
  const loadedLabels = new Promise<Label[]>((resolve) => {
    resolveLabels = resolve;
  });
  renderServiceLink({ loadedLabels });

  expect(await screen.findByText('No connections added.')).toBeInTheDocument();
  await act(async () => {
    resolveLabels([...SERVICE_LABELS, FRONTEND_LABEL]);
  });

  expect(await screen.findByDisplayValue('frontend')).toBeInTheDocument();
  expect(screen.getByDisplayValue('otel-demo')).toBeInTheDocument();
  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add connection' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save labels' })).toBeDisabled();
});

it('writes service_name and namespace into check labels when a service is selected', async () => {
  mockKgApi({ names: ['frontend', 'cartservice'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink();

  await addConnection(user, 'Service');
  await user.click(screen.getByRole('combobox', { name: 'Service name' }));
  await user.click(await screen.findByRole('option', { name: 'frontend' }));
  await user.click(screen.getByRole('combobox', { name: 'Namespace' }));
  await user.click(await screen.findByRole('option', { name: 'otel-demo' }));

  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify(SERVICE_LABELS));
  expect(screen.getByRole('button', { name: 'Save labels' })).toBeEnabled();
});

it('adds an empty CAL-managed service connection and writes to its cost attribution field', async () => {
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink({ calLabels: [{ name: 'service_name', value: '' }] });

  expect(await screen.findByText('No connections added.')).toBeInTheDocument();
  await addConnection(user, 'Service');
  await user.click(screen.getByRole('combobox', { name: 'Service name' }));
  await user.click(await screen.findByRole('option', { name: 'frontend' }));

  expect(screen.getByTestId('cal-labels-output')).toHaveTextContent('"name":"service_name","value":"frontend"');
  expect(screen.getByTestId('labels-output')).not.toHaveTextContent('service_name');
});

it('removes both service labels while preserving the frontend and unrelated custom labels', async () => {
  const { user } = renderServiceLink({ labels: [...SERVICE_LABELS, FRONTEND_LABEL, CUSTOM_LABEL] });

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Remove service connection' }));

  expect(screen.queryByRole('combobox', { name: 'Service name' })).not.toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveValue('banking · production');
  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify([FRONTEND_LABEL, CUSTOM_LABEL]));

  await addConnection(user, 'Service');
  expect(screen.getByRole('combobox', { name: 'Service name' })).toHaveValue('');
  expect(screen.getByRole('combobox', { name: 'Namespace' })).toHaveValue('');
});

it('removes CAL-managed service values without deleting fixed CAL rows or other connections', async () => {
  const { user } = renderServiceLink({
    labels: [CUSTOM_LABEL],
    calLabels: [...SERVICE_LABELS, FRONTEND_LABEL, { name: 'team', value: 'payments' }],
  });

  expect(await screen.findByDisplayValue('frontend')).toBeInTheDocument();
  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Remove service connection' }));

  expect(screen.getByTestId('cal-labels-output')).toHaveTextContent(
    JSON.stringify([
      { name: 'service_name', value: '' },
      { name: 'namespace', value: '' },
      FRONTEND_LABEL,
      { name: 'team', value: 'payments' },
    ])
  );
  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify([CUSTOM_LABEL]));
  expect(screen.queryByRole('combobox', { name: 'Service name' })).not.toBeInTheDocument();
});

it('does not show a persistent success message for a matching service', async () => {
  const requests: Request[] = [];
  server.use(
    apiRoute(
      'searchKnowledgeGraphEntities',
      {
        result: () => ({ json: { data: { entities: [{ name: 'frontend', scope: { namespace: 'otel-demo' } }] } } }),
      },
      (request) => requests.push(request)
    )
  );
  renderServiceLink({ labels: SERVICE_LABELS });

  expect(await screen.findByDisplayValue('frontend')).toBeInTheDocument();
  await waitFor(() => expect(requests).toHaveLength(1));
  expect(screen.queryByText(/Matching service/)).not.toBeInTheDocument();
  expect(screen.queryByText(/No matching service/)).not.toBeInTheDocument();
});

it('shows a hint when no matching service exists in the Knowledge Graph yet', async () => {
  mockKgApi({ names: ['frontend'], namespaces: ['otel-demo'], matchingServices: [] });
  renderServiceLink({ labels: [{ name: 'service_name', value: 'my-new-service' }] });

  expect(await screen.findByText(/No matching service in the Knowledge Graph yet/)).toBeInTheDocument();
});

it('treats a namespace mismatch as no match', async () => {
  mockKgApi({
    names: ['frontend'],
    namespaces: ['otel-demo'],
    matchingServices: [{ name: 'frontend', namespace: 'other-namespace' }],
  });
  renderServiceLink({ labels: SERVICE_LABELS });

  expect(await screen.findByText(/No matching service in the Knowledge Graph yet/)).toBeInTheDocument();
});

it('disables service editing, removal, and adding another connection in a read-only form', async () => {
  renderServiceLink({ labels: SERVICE_LABELS, disabled: true });

  expect(await screen.findByRole('combobox', { name: 'Service name' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Namespace' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove service connection' })).toBeDisabled();
  expect(await screen.findByRole('button', { name: 'Add connection' })).toBeDisabled();
});
