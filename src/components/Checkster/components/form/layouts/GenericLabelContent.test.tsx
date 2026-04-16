import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { TENANT_COST_ATTRIBUTION_LABELS } from 'test/fixtures/tenants';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericLabelContent } from './GenericLabelContent';

jest.mock('../../ui/SectionContent', () => ({
  SectionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../../hooks/useRelevantErrors', () => ({
  useRelevantErrors: jest.fn(() => []),
}));

const calNames = TENANT_COST_ATTRIBUTION_LABELS.names;

function renderGenericLabelContent(
  props: Partial<React.ComponentProps<typeof GenericLabelContent>> = {},
  formValues: Record<string, unknown> = {}
) {
  return formTestRenderer(
    GenericLabelContent,
    { description: 'Test description', ...props } as any,
    { calLabels: [], ...formValues }
  );
}

describe('GenericLabelContent', () => {
  describe('when CALs feature flag is enabled', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
    });

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
        expect(screen.getByText('Cost attribution labels')).toBeInTheDocument();
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
        expect(screen.getByRole('textbox', { name: 'Cost attribution label 1 value' })).toHaveValue('team-a');
        expect(screen.getByRole('textbox', { name: 'Cost attribution label 2 value' })).toHaveValue('service-a');
      });
    });

    it('moves CAL-matching labels to CAL section and keeps custom labels separate', async () => {
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
        expect(screen.getByRole('textbox', { name: 'Cost attribution label 1 value' })).toHaveValue('team-a');
        expect(screen.getByDisplayValue('custom')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Custom labels 1 value' })).toHaveValue('my-value');
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

    describe('label limit accounts for CALs', () => {
      const labelLimit = 10;

      it('allows up to limit minus CAL count custom labels (2 CALs → 8 custom)', async () => {
        renderGenericLabelContent({ calNames, labelLimit });

        await waitFor(() => {
          calNames.forEach((name) => {
            expect(screen.getByDisplayValue(name)).toBeInTheDocument();
          });
        });

        const addButton = screen.getByRole('button', { name: /label/i });
        expect(addButton).not.toBeDisabled();
      });

      it('allows full limit when there are no CALs (0 CALs → 10 custom)', async () => {
        renderGenericLabelContent({ calNames: [], labelLimit });

        const addButton = screen.getByRole('button', { name: /label/i });
        expect(addButton).not.toBeDisabled();
      });

      it('disables adding labels when custom labels fill remaining slots (2 CALs + 8 custom)', async () => {
        const customLabels = Array.from({ length: 8 }, (_, i) => ({
          name: `label${i}`,
          value: `value${i}`,
        }));

        renderGenericLabelContent(
          { calNames, labelLimit },
          { labels: [...customLabels, { name: 'Team', value: 'team-a' }, { name: 'Service', value: 'svc-a' }] }
        );

        await waitFor(() => {
          expect(screen.getByDisplayValue('label0')).toBeInTheDocument();
        });

        const addButton = screen.getByRole('button', { name: /label/i });
        expect(addButton).toBeDisabled();
      });

      it('allows one more when a CAL-matching label frees a custom slot (2 CALs + 8 labels, 1 is a CAL)', async () => {
        const customLabels = Array.from({ length: 7 }, (_, i) => ({
          name: `label${i}`,
          value: `value${i}`,
        }));

        renderGenericLabelContent(
          { calNames, labelLimit },
          { labels: [...customLabels, { name: 'Team', value: 'team-a' }] }
        );

        await waitFor(() => {
          expect(screen.getByDisplayValue('label0')).toBeInTheDocument();
          expect(screen.getByRole('textbox', { name: 'Cost attribution label 1 value' })).toHaveValue('team-a');
        });

        const addButton = screen.getByRole('button', { name: /label/i });
        expect(addButton).not.toBeDisabled();
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
  });

  describe('when CALs feature flag is disabled', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: false });
    });

    it('does not render the CAL section even when calNames are provided', () => {
      renderGenericLabelContent({ calNames });

      expect(screen.queryByText(/Cost attribution labels/)).not.toBeInTheDocument();
    });

    it('renders the custom labels section normally', () => {
      renderGenericLabelContent({ calNames: [] });

      expect(screen.getByText('Custom labels')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /label/i })).toBeInTheDocument();
    });

    it('renders existing custom labels', async () => {
      renderGenericLabelContent(
        { calNames: [] },
        {
          labels: [{ name: 'env', value: 'production' }],
        }
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('env')).toBeInTheDocument();
        expect(screen.getByDisplayValue('production')).toBeInTheDocument();
      });
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
