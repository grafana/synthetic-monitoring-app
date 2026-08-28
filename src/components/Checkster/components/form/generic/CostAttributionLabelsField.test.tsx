import React from 'react';
import { useAppPluginInstalled } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from 'test/server';
import { mockFeatureToggles, testUsesCombobox } from 'test/utils';

import { FeatureName } from 'types';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericLabelContent } from '../layouts/GenericLabelContent';
import { CostAttributionLabelsField } from './CostAttributionLabelsField';

jest.mock('../../../hooks/useRelevantErrors', () => ({
  useRelevantErrors: jest.fn(() => []),
}));

// The setup nudge hook is react-query based and formTestRenderer has no QueryClient,
// so the underlying query hook is mocked out (no CALs configured -> no nudge).
jest.mock('data/useTenantCostAttributionLabels', () => ({
  useTenantCostAttributionLabels: jest.fn(() => ({
    data: undefined,
    isLoading: false,
  })),
}));

function renderCostAttributionLabelsField(formValues: Record<string, unknown> = {}) {
  return formTestRenderer(CostAttributionLabelsField, {} as any, formValues);
}

// The regression test needs the CAL rows and the custom label rows on the same form,
// matching how LabelSection composes them.
function CalAndCustomLabels() {
  return (
    <>
      <CostAttributionLabelsField />
      <GenericLabelContent description="Test description" />
    </>
  );
}

describe('CostAttributionLabelsField', () => {
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

      const user = renderCostAttributionLabelsField({
        calLabels: kgCalNames.map((name) => ({ name, value: '' })),
      });

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

      renderCostAttributionLabelsField({
        calLabels: kgCalNames.map((name) => ({ name, value: '' })),
      });

      expect(await screen.findByRole('textbox', { name: 'Cost attribution label 1 value' })).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('renders plain value inputs when the KG feature flag is disabled, even with the app installed', async () => {
      mockFeatureToggles({ [FeatureName.KnowledgeGraph]: false });
      (useAppPluginInstalled as jest.Mock).mockReturnValue({ loading: false, error: undefined, value: true });

      renderCostAttributionLabelsField({
        calLabels: kgCalNames.map((name) => ({ name, value: '' })),
      });

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

      const user = formTestRenderer(CalAndCustomLabels, {} as any, {
        calLabels: [{ name: 'service_name', value: '' }],
        labels: [],
      });

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
