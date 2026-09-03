import React from 'react';
import { useAppPluginInstalled } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { mockFeatureToggles } from 'test/utils';

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

function renderGenericLabelContent(
  props: Partial<React.ComponentProps<typeof GenericLabelContent>> = {},
  formValues: Record<string, unknown> = {}
) {
  return formTestRenderer(GenericLabelContent, { description: 'Test description', ...props } as any, formValues);
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

  describe('Knowledge Graph reserved labels (service_name / namespace)', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
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
});
