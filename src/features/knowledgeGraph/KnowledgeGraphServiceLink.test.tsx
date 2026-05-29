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

const PROPERTY_VALUES_URL =
  '/api/plugins/grafana-asserts-app/resources/asserts/api-server/v1/entity_type/property_values';
const TOGGLE_LABEL = 'Link to Knowledge Graph service';

const mockUseAppPluginInstalled = useAppPluginInstalled as jest.Mock;

function setKgInstalled(value: boolean) {
  mockUseAppPluginInstalled.mockReturnValue({ loading: false, error: undefined, value });
}

function mockPropertyValues({ names = [], namespaces = [] }: { names?: string[]; namespaces?: string[] }) {
  server.use(
    http.post(PROPERTY_VALUES_URL, async ({ request }) => {
      const body = (await request.json()) as { propertyName?: string };
      const values = body?.propertyName === 'namespace' ? namespaces : names;
      return HttpResponse.json({ values });
    })
  );
}

function renderServiceLink(defaultLabels: Label[] = []) {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const form = useForm<CheckFormValues>({ defaultValues: { labels: defaultLabels } });
    const labels = form.watch('labels');

    return (
      <FormProvider {...form}>
        {children}
        <div data-testid="labels-output">{JSON.stringify(labels)}</div>
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

  expect(screen.queryByLabelText(TOGGLE_LABEL)).not.toBeInTheDocument();
  expect(screen.queryByText(TOGGLE_LABEL)).not.toBeInTheDocument();
});

it(`renders the toggle (off) with fields hidden when installed and no labels are set`, async () => {
  setKgInstalled(true);
  mockPropertyValues({ names: ['frontend'], namespaces: ['otel-demo'] });
  renderServiceLink();

  expect(await screen.findByLabelText(TOGGLE_LABEL)).not.toBeChecked();
  expect(screen.queryByPlaceholderText('Select or type a service name')).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Select or type a namespace')).not.toBeInTheDocument();
});

it(`reveals the service link fields when the toggle is switched on`, async () => {
  setKgInstalled(true);
  mockPropertyValues({ names: ['frontend'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink();

  await user.click(await screen.findByLabelText(TOGGLE_LABEL));

  expect(await screen.findByPlaceholderText('Select or type a service name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Select or type a namespace')).toBeInTheDocument();
});

it(`starts enabled and pre-populates the fields from existing service_name / namespace labels`, async () => {
  setKgInstalled(true);
  mockPropertyValues({ names: ['frontend'], namespaces: ['otel-demo'] });
  renderServiceLink([
    { name: 'service_name', value: 'frontend' },
    { name: 'namespace', value: 'otel-demo' },
  ]);

  expect(await screen.findByLabelText(TOGGLE_LABEL)).toBeChecked();
  expect(await screen.findByDisplayValue('frontend')).toBeInTheDocument();
  expect(screen.getByDisplayValue('otel-demo')).toBeInTheDocument();
});

it(`writes service_name and namespace into the check labels when a service is selected`, async () => {
  setKgInstalled(true);
  mockPropertyValues({ names: ['frontend', 'cartservice'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink();

  await user.click(await screen.findByLabelText(TOGGLE_LABEL));

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

it(`clears the service_name / namespace labels when the toggle is switched off`, async () => {
  setKgInstalled(true);
  mockPropertyValues({ names: ['frontend'], namespaces: ['otel-demo'] });
  const { user } = renderServiceLink([
    { name: 'service_name', value: 'frontend' },
    { name: 'namespace', value: 'otel-demo' },
    { name: 'team', value: 'sm' },
  ]);

  await user.click(await screen.findByLabelText(TOGGLE_LABEL));

  await waitFor(() => {
    const output = screen.getByTestId('labels-output').textContent ?? '';
    expect(output).not.toContain('service_name');
    expect(output).not.toContain('namespace');
  });
  // unrelated labels are preserved
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"team","value":"sm"');
});
