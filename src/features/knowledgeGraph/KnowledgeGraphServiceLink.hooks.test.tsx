import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAppPluginInstalled } from '@grafana/runtime';
import { renderHook, screen, waitFor } from '@testing-library/react';
import { createWrapper, render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { CheckFormValues, FeatureName, Label } from 'types';

import { useKGLinkedLabel, useKGReservedLabels } from './KnowledgeGraphServiceLink.hooks';

const mockUseAppPluginInstalled = useAppPluginInstalled as jest.Mock;

function setKgInstalled(value: boolean) {
  mockUseAppPluginInstalled.mockReturnValue({ loading: false, error: undefined, value });
}

interface HarnessProps {
  labelName: string;
  labels?: Label[];
  calLabels?: Label[];
}

/**
 * Renders the linked-label accessor with buttons standing in for the combobox: selecting a
 * value and clearing it (what the combobox's clear icon does).
 */
function renderLinkedLabel({ labelName, labels = [], calLabels = [] }: HarnessProps) {
  function Harness() {
    const linked = useKGLinkedLabel(labelName);

    return (
      <>
        <button onClick={() => linked.onChange('frontend')}>select</button>
        <button onClick={() => linked.onChange('')}>clear</button>
        <div data-testid="value">{linked.value ?? 'unset'}</div>
      </>
    );
  }

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const form = useForm<CheckFormValues>({ defaultValues: { labels, calLabels } });

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
      <Harness />
    </Wrapper>
  );
}

describe('useKGLinkedLabel', () => {
  it(`removes the label when the value is cleared, leaving other labels untouched`, async () => {
    const { user } = renderLinkedLabel({
      labelName: 'service_name',
      labels: [
        { name: 'service_name', value: 'frontend' },
        { name: 'team', value: 'sm' },
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'clear' }));

    await waitFor(() => {
      expect(screen.getByTestId('labels-output')).not.toHaveTextContent('service_name');
    });
    expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"team","value":"sm"');
    expect(screen.getByTestId('value')).toHaveTextContent('unset');
  });

  it(`keeps the cost attribution row with an empty value when a CAL-managed value is cleared`, async () => {
    const { user } = renderLinkedLabel({
      labelName: 'service_name',
      calLabels: [{ name: 'service_name', value: 'frontend' }],
    });

    await user.click(await screen.findByRole('button', { name: 'clear' }));

    await waitFor(() => {
      expect(screen.getByTestId('cal-labels-output')).toHaveTextContent('"name":"service_name","value":""');
    });
    expect(screen.getByTestId('labels-output')).not.toHaveTextContent('service_name');
  });

  it(`re-selecting a value after clearing adds the label back`, async () => {
    const { user } = renderLinkedLabel({ labelName: 'service_name' });

    await user.click(await screen.findByRole('button', { name: 'select' }));

    await waitFor(() => {
      expect(screen.getByTestId('labels-output')).toHaveTextContent('"name":"service_name","value":"frontend"');
    });
  });
});

describe('useKGReservedLabels', () => {
  function renderReservedLabels({ calLabels = [] }: { calLabels?: Label[] } = {}) {
    const { Wrapper: ProviderWrapper } = createWrapper();

    const Wrapper = ({ children }: { children: ReactNode }) => {
      const form = useForm<CheckFormValues>({ defaultValues: { labels: [], calLabels } });

      return (
        <ProviderWrapper>
          <FormProvider {...form}>{children}</FormProvider>
        </ProviderWrapper>
      );
    };

    return renderHook(() => useKGReservedLabels(), { wrapper: Wrapper });
  }

  // The app providers render children asynchronously, so result.current stays null (the
  // pre-render sentinel) until the first hook render lands. undefined is a real hook result.
  async function waitForHookRender(result: { current: unknown }) {
    await waitFor(() => expect(result.current).not.toBeNull());
  }

  beforeEach(() => {
    mockFeatureToggles({ [FeatureName.KnowledgeGraph]: true });
  });

  it(`reserves service_name and namespace when the Knowledge Graph app is installed`, async () => {
    setKgInstalled(true);
    const { result } = renderReservedLabels();

    await waitForHookRender(result);
    expect(result.current?.names).toEqual(['service_name', 'namespace']);
    expect(result.current?.message('service_name')).toBe(
      'service_name is used for service connections. Select a service above to connect this check, or use a different name for your custom label.'
    );
  });

  it(`reserves nothing when the Knowledge Graph app is not installed`, async () => {
    setKgInstalled(false);
    const { result } = renderReservedLabels();

    await waitForHookRender(result);
    expect(result.current).toBeUndefined();
  });

  it(`reserves nothing when the feature flag is disabled, even with the app installed`, async () => {
    mockFeatureToggles({ [FeatureName.KnowledgeGraph]: false });
    setKgInstalled(true);
    const { result } = renderReservedLabels();

    await waitForHookRender(result);
    expect(result.current).toBeUndefined();
  });

  it(`does not reserve a name that is managed as a cost attribution label`, async () => {
    setKgInstalled(true);
    const { result } = renderReservedLabels({ calLabels: [{ name: 'service_name', value: '' }] });

    // service_name is CAL-managed (the service link edits calLabels, not labels), so a
    // user-typed custom label with that name must stay visible for the CAL-conflict
    // validation to be seen and fixed.
    await waitForHookRender(result);
    expect(result.current?.names).toEqual(['namespace']);
  });
});
