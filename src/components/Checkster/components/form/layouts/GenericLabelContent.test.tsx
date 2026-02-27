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

describe('GenericLabelContent - CAL section', () => {
  it('renders CAL rows with readonly name inputs in the CAL section', async () => {
    renderGenericLabelContent({ calNames });

    await waitFor(() => {
      calNames.forEach((name) => {
        const input = screen.getByDisplayValue(name);
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('readonly');
      });
    });
  });

  it('renders the CAL section heading and description', async () => {
    renderGenericLabelContent({ calNames });

    await waitFor(() => {
      expect(screen.getByText(/Cost attribution labels \*/)).toBeInTheDocument();
      expect(screen.getByText(/help track costs across teams and services/)).toBeInTheDocument();
    });
  });

  it('does not render the CAL section when calNames is empty', () => {
    renderGenericLabelContent({ calNames: [] });

    expect(screen.queryByText(/Cost attribution labels/)).not.toBeInTheDocument();
  });

  it('does not show remove buttons for CAL rows', async () => {
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
          { name: 'Team', value: 'team-a' },
          { name: 'Service', value: 'service-a' },
        ],
      }
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('team-a')).toBeInTheDocument();
      expect(screen.getByDisplayValue('service-a')).toBeInTheDocument();
    });
  });

  it('preserves CAL rows when removing user labels', async () => {
    const user = renderGenericLabelContent(
      { calNames },
      {
        labels: [
          { name: 'Team', value: 'team-a' },
          { name: 'Service', value: 'service-a' },
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
          { name: 'Team', value: 'team-a' },
          { name: 'custom', value: 'my-value' },
        ],
      }
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Team')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Cost attribution label 1 value' })).toHaveValue('team-a');
      expect(screen.getByDisplayValue('custom')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Custom labels 1 value' })).toHaveValue('my-value');
    });
  });

  it('allows removing user-added labels but not CAL rows', async () => {
    const user = renderGenericLabelContent(
      { calNames: ['Team'] },
      {
        labels: [
          { name: 'Team', value: 'team-a' },
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
      expect(screen.getByDisplayValue('Team')).toBeInTheDocument();
    });
  });

  it('shows loading state while loading', () => {
    renderGenericLabelContent({ isLoading: true, calNames });

    expect(screen.getByText('Loading label limits')).toBeInTheDocument();
  });

  it('renders custom labels section when calNames is empty', () => {
    renderGenericLabelContent({ calNames: [] });

    const removeButtons = screen.queryAllByRole('button', { name: /^remove$/i });
    expect(removeButtons).toHaveLength(0);
  });
});
