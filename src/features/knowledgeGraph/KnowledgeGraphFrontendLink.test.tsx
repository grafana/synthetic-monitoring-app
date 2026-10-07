import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen, waitFor } from '@testing-library/react';
import { KG_FRONTEND_APPS } from 'test/fixtures/knowledgeGraph';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { testUsesCombobox } from 'test/utils';

import { CheckFormValues, Label } from 'types';

import { KnowledgeGraphFrontendLink } from './KnowledgeGraphFrontendLink';

const EXISTING_LABELS: Label[] = [
  { name: 'service_name', value: 'frontend' },
  { name: 'namespace', value: 'banking-prod' },
  { name: 'app', value: 'banking' },
];

interface RenderOptions {
  labels?: Label[];
  calLabels?: Label[];
  disabled?: boolean;
  autoFocus?: boolean;
  onRemove?: () => void;
}

function renderFrontendLink({ labels = [], calLabels = [], disabled = false, autoFocus, onRemove }: RenderOptions = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const form = useForm<CheckFormValues>({ defaultValues: { labels, calLabels }, disabled });

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
      <KnowledgeGraphFrontendLink autoFocus={autoFocus} onRemove={onRemove} />
    </Wrapper>
  );
}

beforeEach(() => {
  testUsesCombobox();
});

it('selects, changes, and clears the frontend without changing service connections or custom labels', async () => {
  const onRemove = jest.fn();
  const { user } = renderFrontendLink({ labels: EXISTING_LABELS, onRemove });

  const input = await screen.findByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  expect(input).toHaveValue('');

  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /banking · production/ }));

  expect(input).toHaveValue('banking · production');
  expect(screen.getByTestId('labels-output')).toHaveTextContent(
    JSON.stringify([...EXISTING_LABELS, { name: 'feo11y_app_id', value: '229' }])
  );

  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /ecommerce · production/ }));

  expect(screen.getByTestId('labels-output')).toHaveTextContent(
    JSON.stringify([...EXISTING_LABELS, { name: 'feo11y_app_id', value: '230' }])
  );

  await user.click(screen.getByRole('button', { name: 'Remove frontend connection' }));

  expect(input).toHaveValue('');
  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify(EXISTING_LABELS));
  expect(onRemove).toHaveBeenCalledTimes(1);
});

it('lets the user remove an empty frontend connection without changing existing labels', async () => {
  const onRemove = jest.fn();
  const { user } = renderFrontendLink({ labels: EXISTING_LABELS, onRemove });

  await user.click(await screen.findByRole('button', { name: 'Remove frontend connection' }));

  expect(onRemove).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify(EXISTING_LABELS));
});

it('restores a saved frontend by app ID and displays its name and environment', async () => {
  renderFrontendLink({ labels: [{ name: 'feo11y_app_id', value: '229' }] });

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
});

it('preserves an unavailable app ID and lets the user remove its connection', async () => {
  const { user } = renderFrontendLink({ labels: [{ name: 'feo11y_app_id', value: '999' }] });

  expect(await screen.findByText('No matching frontend in Knowledge Graph yet.')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Frontend application' })).toHaveValue('App ID 999');
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":"999"');

  await user.click(screen.getByRole('button', { name: 'Remove frontend connection' }));

  expect(screen.getByTestId('labels-output')).toHaveTextContent('[]');
});

it('edits and clears a cost attribution label without creating an ordinary label with the same name', async () => {
  const { user } = renderFrontendLink({
    labels: EXISTING_LABELS,
    calLabels: [{ name: 'feo11y_app_id', value: '' }],
  });

  const input = await screen.findByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await user.click(input);
  await user.click(await screen.findByRole('option', { name: /banking · production/ }));

  expect(screen.getByTestId('cal-labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":"229"');
  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify(EXISTING_LABELS));

  await user.click(screen.getByRole('button', { name: 'Remove frontend connection' }));

  expect(screen.getByTestId('cal-labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":""');
  expect(screen.getByTestId('labels-output')).toHaveTextContent(JSON.stringify(EXISTING_LABELS));
});

it('disables selection and removal when the form is read-only', async () => {
  renderFrontendLink({ labels: [{ name: 'feo11y_app_id', value: '229' }], disabled: true });

  expect(await screen.findByDisplayValue('banking · production')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove frontend connection' })).toBeDisabled();
});

it('preserves the selection on a lookup failure and reloads its display name after retrying', async () => {
  server.use(apiRoute('searchKnowledgeGraphEntities', { result: () => ({ status: 500 }) }));
  const { user } = renderFrontendLink({ labels: [{ name: 'feo11y_app_id', value: '229' }], autoFocus: true });

  expect(await screen.findByText(/Could not load frontend applications/)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus());
  expect(screen.queryByText('No matching frontend in Knowledge Graph yet.')).not.toBeInTheDocument();
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":"229"');

  server.use(apiRoute('searchKnowledgeGraphEntities'));
  await user.click(screen.getByRole('button', { name: 'Retry' }));

  expect(await screen.findByDisplayValue('banking · production')).toBeInTheDocument();
});

it('explains when no frontend applications have been discovered', async () => {
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: () => ({ json: { data: { entities: [], lastPage: true } } }),
    })
  );
  renderFrontendLink();

  expect(await screen.findByText('No frontend applications discovered in Knowledge Graph yet.')).toBeInTheDocument();
  expect(screen.getByTestId('labels-output')).toHaveTextContent('[]');
});

it('combines an application across paginated environments and explains the scope of its connection', async () => {
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
  const { user } = renderFrontendLink();

  const input = await screen.findByRole('combobox', { name: 'Frontend application' });
  await waitFor(() => expect(input).toBeEnabled());
  await user.click(input);

  expect(await screen.findAllByRole('option')).toHaveLength(1);
  await user.click(screen.getByRole('option', { name: /banking · production · staging/ }));

  expect(screen.getByText('This connection includes all listed environments for this application.')).toBeInTheDocument();
  expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"feo11y_app_id","value":"229"');
});
