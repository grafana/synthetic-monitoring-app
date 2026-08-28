import React from 'react';
import { useAppPluginInstalled } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { TENANT_COST_ATTRIBUTION_LABELS } from 'test/fixtures/tenants';
import { server } from 'test/server';
import { mockFeatureToggles, testUsesCombobox } from 'test/utils';

import { FeatureName } from 'types';
import { LabelMode } from 'datasource/responses.types';
import { useLabelMode } from 'data/useLabelMode';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericLabelContent } from './GenericLabelContent';

jest.mock('../../ui/SectionContent', () => ({
  SectionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../../hooks/useRelevantErrors', () => ({
  useRelevantErrors: jest.fn(() => []),
}));

jest.mock('data/useLabelMode', () => ({
  useLabelMode: jest.fn(),
}));

const useLabelModeMock = useLabelMode as jest.Mock;

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
  beforeEach(() => {
    useLabelModeMock.mockReturnValue({ data: { mode: LabelMode.Prefixed, systemLabels: [] } });
  });

  describe('label_ prefix hint', () => {
    it('shows the label_ prefix hint while the tenant is in PREFIXED mode', () => {
      useLabelModeMock.mockReturnValue({ data: { mode: LabelMode.Prefixed, systemLabels: [] } });
      renderGenericLabelContent();
      expect(screen.getByText('label')).toBeInTheDocument();
    });

    it('hides the label_ prefix hint once the tenant has moved to DUAL_WRITE', () => {
      useLabelModeMock.mockReturnValue({ data: { mode: LabelMode.DualWrite, systemLabels: [] } });
      renderGenericLabelContent();
      expect(screen.queryByText('label')).not.toBeInTheDocument();
    });

    it('hides the label_ prefix hint once the tenant has moved to UNPREFIXED', () => {
      useLabelModeMock.mockReturnValue({ data: { mode: LabelMode.Unprefixed, systemLabels: [] } });
      renderGenericLabelContent();
      expect(screen.queryByText('label')).not.toBeInTheDocument();
    });

    it('shows the hint while the label mode is still loading, matching the legacy always-on behavior', () => {
      useLabelModeMock.mockReturnValue({ data: undefined });
      renderGenericLabelContent();
      expect(screen.getByText('label')).toBeInTheDocument();
    });
  });

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

    describe('Knowledge Graph linked CALs (service_name / namespace)', () => {
      const kgCalNames = ['service_name', 'namespace'];
      const PROPERTY_VALUES_URL =
        '/api/plugins/grafana-asserts-app/resources/asserts/api-server/v1/entity_type/property_values';

      function mockKgSuggestions({ names = [], namespaces = [] }: { names?: string[]; namespaces?: string[] }) {
        server.use(
          http.post(PROPERTY_VALUES_URL, async ({ request }) => {
            const body = (await request.json()) as { propertyName?: string };
            const values = body?.propertyName === 'namespace' ? namespaces : names;
            return HttpResponse.json({ values });
          })
        );
      }

      it('renders a KG suggestions combobox for service_name / namespace values when the KG app is installed', async () => {
        testUsesCombobox();
        mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
        (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: true });
        mockKgSuggestions({ names: ['frontend'], namespaces: ['otel-demo'] });

        const user = renderGenericLabelContent(
          { calNames: kgCalNames },
          { calLabels: kgCalNames.map((name) => ({ name, value: '' })) }
        );

        const comboboxes = await screen.findAllByRole('combobox');
        expect(comboboxes).toHaveLength(2);

        await user.click(comboboxes[0]);
        await user.click(await screen.findByRole('option', { name: 'frontend' }));

        await waitFor(() => {
          expect(screen.getByDisplayValue('frontend')).toBeInTheDocument();
        });
      });

      it('renders plain value inputs for service_name / namespace when the KG app is not installed', async () => {
        (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: false });

        renderGenericLabelContent(
          { calNames: kgCalNames },
          { calLabels: kgCalNames.map((name) => ({ name, value: '' })) }
        );

        expect(await screen.findByRole('textbox', { name: 'Cost attribution label 1 value' })).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      });

      it('renders plain value inputs when the KG feature flag is disabled, even with the app installed', async () => {
        mockFeatureToggles({ [FeatureName.KnowledgeGraph]: false });
        (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: true });

        renderGenericLabelContent(
          { calNames: kgCalNames },
          { calLabels: kgCalNames.map((name) => ({ name, value: '' })) }
        );

        expect(await screen.findByRole('textbox', { name: 'Cost attribution label 1 value' })).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      });

      it('keeps a typed CAL-managed name visible as a custom label row instead of hiding it', async () => {
        // Regression test: service_name declared as a CAL and typed into a custom label row.
        // The KG service link edits calLabels for CAL-managed names, so hiding the labels row
        // would leave an invisible row that fails the CAL-conflict validation with no way to
        // remove it. The row must stay visible (and removable) after blur.
        testUsesCombobox();
        mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
        (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: true });
        mockKgSuggestions({ names: [], namespaces: [] });

        const user = renderGenericLabelContent(
          { calNames: ['service_name'] },
          { calLabels: [{ name: 'service_name', value: '' }] }
        );

        const nameInput = await screen.findByPlaceholderText('name');
        await user.type(nameInput, 'service_name');

        const valueInput = screen.getByRole('textbox', { name: 'Custom labels 1 value' });
        await user.type(valueInput, 'frontend');
        await user.click(screen.getByText('Cost attribution labels'));

        expect(screen.getByRole('textbox', { name: 'Custom labels 1 name' })).toHaveValue('service_name');
        expect(screen.getByRole('textbox', { name: 'Custom labels 1 value' })).toHaveValue('frontend');
        expect(screen.getByRole('button', { name: /^remove$/i })).toBeInTheDocument();
      });
    });
  });

  describe('Knowledge Graph reserved labels (service_name / namespace)', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: false, [FeatureName.KnowledgeGraph]: true });
    });

    it('hides service_name / namespace rows from the custom labels when the KG app is installed', async () => {
      (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: true });

      renderGenericLabelContent(
        {},
        {
          labels: [
            { name: 'service_name', value: 'frontend' },
            { name: 'namespace', value: 'otel-demo' },
            { name: 'env', value: 'production' },
          ],
        }
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('env')).toBeInTheDocument();
      });
      expect(screen.queryByDisplayValue('service_name')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('namespace')).not.toBeInTheDocument();
    });

    it('shows a redirect message when the user types a reserved name into a custom label', async () => {
      (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: true });

      const user = renderGenericLabelContent({}, { labels: [] });

      const nameInput = screen.getByPlaceholderText('name');
      await user.type(nameInput, 'service_name');

      expect(
        await screen.findByText(
          'service_name is used for service connections. Select a service above to connect this check, or use a different name for your custom label.'
        )
      ).toBeInTheDocument();
    });

    it('renders service_name / namespace as ordinary custom labels when the KG app is not installed', async () => {
      (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: false });

      renderGenericLabelContent(
        {},
        {
          labels: [
            { name: 'service_name', value: 'frontend' },
            { name: 'namespace', value: 'otel-demo' },
          ],
        }
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('service_name')).toBeInTheDocument();
        expect(screen.getByDisplayValue('namespace')).toBeInTheDocument();
      });
    });

    it('renders service_name / namespace as ordinary custom labels when the feature flag is disabled, even with the app installed', async () => {
      mockFeatureToggles({ [FeatureName.KnowledgeGraph]: false });
      (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: true });

      renderGenericLabelContent(
        {},
        {
          labels: [
            { name: 'service_name', value: 'frontend' },
            { name: 'namespace', value: 'otel-demo' },
          ],
        }
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('service_name')).toBeInTheDocument();
        expect(screen.getByDisplayValue('namespace')).toBeInTheDocument();
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
