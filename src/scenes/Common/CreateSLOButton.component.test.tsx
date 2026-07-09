import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePluginComponent } from '@grafana/runtime';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CreateSLOButton } from './CreateSLOButton';

jest.mock('hooks/useMetricsDS', () => ({
  useMetricsDS: () => ({ uid: 'metrics-test-uid', name: 'Prometheus' }),
}));

function MockWizard({ onSuccess, onClose }: { onSuccess?: () => void; onClose?: () => void }) {
  return (
    <div>
      <button type="button" onClick={() => onSuccess?.()}>
        complete wizard
      </button>
      <button type="button" onClick={() => onClose?.()}>
        close wizard
      </button>
    </div>
  );
}

function renderCreateSLOButton(ui: React.ReactElement) {
  const client = new QueryClient();
  return {
    user: userEvent.setup(),
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
}

describe('CreateSLOButton (component)', () => {
  beforeEach(() => {
    jest.mocked(usePluginComponent).mockReturnValue({
      isLoading: false,
      component: MockWizard,
    });
  });

  it('invokes onCreated when the wizard reports success', async () => {
    const onCreated = jest.fn();
    const { user } = renderCreateSLOButton(<CreateSLOButton check={BASIC_HTTP_CHECK} onCreated={onCreated} />);

    await user.click(await screen.findByRole('button', { name: /create a slo/i }));
    await user.click(await screen.findByRole('button', { name: /complete wizard/i }));

    expect(onCreated).toHaveBeenCalledTimes(1);
  });
});
