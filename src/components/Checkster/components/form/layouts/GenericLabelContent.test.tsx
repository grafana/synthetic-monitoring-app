import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericLabelContent } from './GenericLabelContent';

jest.mock('../../ui/SectionContent', () => ({
  SectionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../../hooks/useRelevantErrors', () => ({
  useRelevantErrors: jest.fn(() => []),
}));

function renderGenericLabelContent(
  props: Partial<React.ComponentProps<typeof GenericLabelContent>> = {},
  formValues: Record<string, unknown> = {}
) {
  return formTestRenderer(GenericLabelContent, { description: 'Test description', ...props } as any, formValues);
}

describe('GenericLabelContent', () => {
  it('shows a loading state while the label limits are being fetched', () => {
    renderGenericLabelContent({ isLoading: true });

    expect(screen.getByText('Loading label limits')).toBeInTheDocument();
  });

  it('renders the custom labels section with its add button', () => {
    renderGenericLabelContent();

    expect(screen.getByText('Custom labels')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /label/i })).toBeInTheDocument();
  });

  it('renders the labels already on the form', async () => {
    renderGenericLabelContent({}, { labels: [{ name: 'env', value: 'production' }] });

    await waitFor(() => {
      expect(screen.getByDisplayValue('env')).toBeInTheDocument();
      expect(screen.getByDisplayValue('production')).toBeInTheDocument();
    });
  });

  it('allows a label to be removed', async () => {
    const user = renderGenericLabelContent({}, { labels: [{ name: 'env', value: 'production' }] });

    await waitFor(() => {
      expect(screen.getByDisplayValue('env')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^remove$/i }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue('env')).not.toBeInTheDocument();
    });
  });

  describe('label limit', () => {
    it('allows more labels to be added while the limit has room', () => {
      renderGenericLabelContent({ labelLimit: 10 });

      expect(screen.getByRole('button', { name: /label/i })).not.toBeDisabled();
    });

    it('stops labels being added once the limit is reached', async () => {
      const labels = Array.from({ length: 8 }, (_, i) => ({ name: `label${i}`, value: `value${i}` }));

      renderGenericLabelContent({ labelLimit: 8 }, { labels });

      await waitFor(() => {
        expect(screen.getByDisplayValue('label0')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /label/i })).toBeDisabled();
    });
  });
});
