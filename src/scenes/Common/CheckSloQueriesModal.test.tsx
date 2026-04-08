import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';
import { server } from 'test/server';

import { CheckSloQueriesModal } from './CheckSloQueriesModal';

const SLO_API_URL = /\/api\/plugins\/grafana-slo-app\/resources\/v1\/slo/;

function renderModal(props: Partial<React.ComponentProps<typeof CheckSloQueriesModal>> = {}) {
  const onDismiss = jest.fn();

  return render(
    <CheckSloQueriesModal check={BASIC_HTTP_CHECK} isOpen={true} onDismiss={onDismiss} {...props} />
  );
}

describe('CheckSloQueriesModal', () => {
  it('renders the modal with title and default fields', async () => {
    renderModal();

    expect(await screen.findByRole('dialog', { name: 'Create a SLO' })).toBeInTheDocument();
    expect(screen.getByLabelText('SLO target percent')).toHaveValue('99.5');
    expect(screen.getByLabelText('SLO window days')).toHaveValue('28');
  });

  it('renders the experimental feedback badge', async () => {
    renderModal();

    expect(await screen.findByText('Experimental')).toBeInTheDocument();
  });

  it('populates the SLO name from the check job', async () => {
    renderModal();

    const nameInput = await screen.findByDisplayValue(`SLO: ${BASIC_HTTP_CHECK.job}`);
    expect(nameInput).toBeInTheDocument();
  });

  it('creates a single-check SLO on submit', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(SLO_API_URL, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ message: 'OK', uuid: 'test-uuid-123' });
      })
    );

    const { user } = renderModal();

    const createButton = await screen.findByRole('button', { name: 'Create a SLO' });
    await user.click(createButton);

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });

    expect(capturedBody).toMatchObject({
      name: `SLO: ${BASIC_HTTP_CHECK.job}`,
      query: { type: 'ratio' },
      objectives: [{ value: 0.995, window: '28d' }],
    });
  });

  it('shows success message after SLO creation', async () => {
    server.use(
      http.post(SLO_API_URL, () => {
        return HttpResponse.json({ message: 'OK', uuid: 'test-uuid-456' });
      })
    );

    const { user } = renderModal();

    const createButton = await screen.findByRole('button', { name: 'Create a SLO' });
    await user.click(createButton);

    expect(await screen.findByText('SLO creation accepted')).toBeInTheDocument();
    expect(screen.getByText('test-uuid-456')).toBeInTheDocument();
  });

  it('shows error message when SLO creation fails', async () => {
    server.use(
      http.post(SLO_API_URL, () => {
        return HttpResponse.json(
          { error: 'Something went wrong' },
          { status: 500 }
        );
      })
    );

    const { user } = renderModal();

    const createButton = await screen.findByRole('button', { name: 'Create a SLO' });
    await user.click(createButton);

    expect(await screen.findByText('Could not create SLO')).toBeInTheDocument();
  });

  it('shows label group content when switching to label group tab', async () => {
    const { user } = renderModal();

    const labelGroupTab = await screen.findByRole('tab', { name: 'Label group' });
    await user.click(labelGroupTab);

    expect(await screen.findByText('Labels to match')).toBeInTheDocument();
  });

  it('shows warning when check has no custom labels in label group tab', async () => {
    const { user } = renderModal({ check: { ...BASIC_HTTP_CHECK, labels: [] } });

    const labelGroupTab = await screen.findByRole('tab', { name: 'Label group' });
    await user.click(labelGroupTab);

    expect(await screen.findByText('Label group needs custom labels')).toBeInTheDocument();
  });

  it('shows validation error for invalid SLO target', async () => {
    const { user } = renderModal();

    const targetInput = await screen.findByLabelText('SLO target percent');
    await user.clear(targetInput);
    await user.type(targetInput, 'abc');

    const createButton = screen.getByRole('button', { name: 'Create a SLO' });
    await user.click(createButton);

    expect(await screen.findByText('Could not create SLO')).toBeInTheDocument();
    expect(screen.getByText(/SLO target must be a percentage/)).toBeInTheDocument();
  });

  it('shows validation error for invalid window', async () => {
    const { user } = renderModal();

    const windowInput = await screen.findByLabelText('SLO window days');
    await user.clear(windowInput);
    await user.type(windowInput, '-5');

    const createButton = screen.getByRole('button', { name: 'Create a SLO' });
    await user.click(createButton);

    expect(await screen.findByText('Could not create SLO')).toBeInTheDocument();
    expect(screen.getByText(/Window must be a whole number/)).toBeInTheDocument();
  });

  it('shows 404 hint when error message contains Not Found', async () => {
    server.use(
      http.post(SLO_API_URL, () => {
        return HttpResponse.json(
          { error: '404 Not Found' },
          { status: 404 }
        );
      })
    );

    const { user } = renderModal();

    const createButton = await screen.findByRole('button', { name: 'Create a SLO' });
    await user.click(createButton);

    expect(await screen.findByText('Could not create SLO')).toBeInTheDocument();
    expect(screen.getByText(/SLO plugin may not be installed/)).toBeInTheDocument();
  });
});
