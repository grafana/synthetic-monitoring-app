import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { TENANT_COST_ATTRIBUTION_LABELS } from 'test/fixtures/tenants';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericLabelContent } from './GenericLabelContent';

jest.mock('../../ui/SectionContent', () => ({
  SectionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../../hooks/useRelevantErrors', () => ({
  useRelevantErrors: jest.fn(() => []),
}));

const calNames = TENANT_COST_ATTRIBUTION_LABELS.items;

function renderGenericLabelContent(
  props: Partial<React.ComponentProps<typeof GenericLabelContent>> = {},
  formValues: Record<string, unknown> = {}
) {
  return formTestRenderer(GenericLabelContent, { description: 'Test description', ...props } as any, formValues);
}

describe('GenericLabelContent - CAL integration', () => {
  it('renders CAL rows with readonly name inputs for a new check', async () => {
    renderGenericLabelContent({ calNames });

    await waitFor(() => {
      calNames.forEach((name) => {
        const input = screen.getByDisplayValue(name);
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('readonly');
      });
    });
  });

  it('does not show remove buttons for CAL-only rows', async () => {
    renderGenericLabelContent({ calNames });

    await waitFor(() => {
      calNames.forEach((name) => {
        expect(screen.getByDisplayValue(name)).toBeInTheDocument();
      });
    });

    const removeButtons = screen.queryAllByRole('button', { name: /^remove$/i });
    expect(removeButtons).toHaveLength(0);
  });

  it('preserves existing values when a check already has CAL labels', async () => {
    renderGenericLabelContent(
      { calNames },
      {
        labels: [
          { name: 'CAL001', value: 'team-a' },
          { name: 'CAL002', value: 'team-b' },
        ],
      }
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('team-a')).toBeInTheDocument();
      expect(screen.getByDisplayValue('team-b')).toBeInTheDocument();
    });
  });

  it('preserves CAL rows when removing user labels', async () => {
    const user = renderGenericLabelContent(
      { calNames },
      {
        labels: [
          { name: 'CAL001', value: 'team-a' },
          { name: 'custom', value: 'my-value' },
        ],
      }
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('custom')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /^remove$/i });
    expect(removeButtons).toHaveLength(1);

    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByDisplayValue('custom')).not.toBeInTheDocument();
      calNames.forEach((name) => {
        expect(screen.getByDisplayValue(name)).toBeInTheDocument();
      });
    });
  });

  it('preserves user-added labels alongside CAL rows', async () => {
    renderGenericLabelContent(
      { calNames },
      {
        labels: [
          { name: 'CAL001', value: 'team-a' },
          { name: 'custom', value: 'my-value' },
        ],
      }
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('CAL001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('team-a')).toBeInTheDocument();
      expect(screen.getByDisplayValue('custom')).toBeInTheDocument();
      expect(screen.getByDisplayValue('my-value')).toBeInTheDocument();
    });
  });

  it('allows removing user-added labels but not CAL rows', async () => {
    const user = renderGenericLabelContent(
      { calNames: ['CAL001'] },
      {
        labels: [
          { name: 'CAL001', value: 'team-a' },
          { name: 'custom', value: 'my-value' },
        ],
      }
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('custom')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /^remove$/i });
    expect(removeButtons).toHaveLength(1);

    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByDisplayValue('custom')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('CAL001')).toBeInTheDocument();
    });
  });

  it('shows loading state while loading', () => {
    renderGenericLabelContent({ isLoading: true, calNames });

    expect(screen.getByText('Loading label limits')).toBeInTheDocument();
  });

  it('renders normally when calNames is empty', () => {
    renderGenericLabelContent({ calNames: [] });

    const removeButtons = screen.queryAllByRole('button', { name: /^remove$/i });
    expect(removeButtons).toHaveLength(0);
  });
});
