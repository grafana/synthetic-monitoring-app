import { useForm, UseFormReturn } from 'react-hook-form';
import { act, renderHook } from '@testing-library/react';

import { CheckFormValues } from 'types';

import { useHydrateCalLabels } from './useHydrateCalLabels';

const CAL_NAMES = ['Team', 'Service'];

function buildDefaults(): CheckFormValues {
  return {
    labels: [
      { name: 'Team', value: 'team-a' },
      { name: 'custom', value: 'my-value' },
    ],
    calLabels: [],
  } as unknown as CheckFormValues;
}

// Mirrors the reset in ChecksterContext, which re-applies defaultFormValues to
// non-dirty fields whenever the defaults recompute (probes resolving, folder
// status arriving).
function simulateDefaultsReset(formMethods: UseFormReturn<CheckFormValues>, defaults: CheckFormValues) {
  formMethods.reset(defaults, {
    keepIsValid: true,
    keepDirty: true,
    keepDirtyValues: true,
    keepTouched: true,
    keepSubmitCount: true,
    keepErrors: true,
  });
}

function setup(defaults: CheckFormValues, calNames: string[] = CAL_NAMES) {
  return renderHook(
    ({ calNames, defaultFormValues }: { calNames: string[]; defaultFormValues: CheckFormValues }) => {
      const formMethods = useForm<CheckFormValues>({ defaultValues: defaultFormValues });
      useHydrateCalLabels(formMethods, calNames, defaultFormValues);
      return formMethods;
    },
    { initialProps: { calNames, defaultFormValues: defaults } }
  );
}

describe('useHydrateCalLabels', () => {
  it('partitions CAL-valued labels into calLabels rows, one per configured name', () => {
    const { result } = setup(buildDefaults());

    expect(result.current.getValues('calLabels')).toEqual([
      { name: 'Team', value: 'team-a' },
      { name: 'Service', value: '' },
    ]);
    expect(result.current.getValues('labels')).toEqual([{ name: 'custom', value: 'my-value' }]);
  });

  it('preserves hydrated CAL values across a defaults reset while labels is dirty', () => {
    const defaults = buildDefaults();
    const { result, rerender } = setup(defaults);

    // The user edits the custom labels, making `labels` dirty. Hydrated calLabels
    // rows are deliberately not dirty, so a reset wipes them back to the
    // unpartitioned defaults while keeping the dirty (CAL-less) labels.
    act(() => {
      result.current.setValue('labels', [{ name: 'custom', value: 'edited' }], { shouldDirty: true });
      simulateDefaultsReset(result.current, defaults);
    });

    // Defaults recompute (new reference), re-running the hydration effect.
    rerender({ calNames: CAL_NAMES, defaultFormValues: buildDefaults() });

    expect(result.current.getValues('calLabels')).toEqual([
      { name: 'Team', value: 'team-a' },
      { name: 'Service', value: '' },
    ]);
    expect(result.current.getValues('labels')).toEqual([{ name: 'custom', value: 'edited' }]);
  });

  it('preserves a CAL value edited before hydration across a defaults reset', () => {
    const defaults = buildDefaults();
    // CAL names have not resolved yet, so the Team row is still an ordinary label.
    const { result, rerender } = setup(defaults, []);

    // The user edits the CAL-named row while it is still in the custom labels.
    act(() => {
      result.current.setValue(
        'labels',
        [
          { name: 'Team', value: 'team-b' },
          { name: 'custom', value: 'my-value' },
        ],
        { shouldDirty: true }
      );
    });

    // CAL names resolve: hydration moves the edited value into calLabels (non-dirty).
    rerender({ calNames: CAL_NAMES, defaultFormValues: defaults });
    expect(result.current.getValues('calLabels')).toEqual([
      { name: 'Team', value: 'team-b' },
      { name: 'Service', value: '' },
    ]);

    // A defaults reset wipes the non-dirty calLabels; the original check labels only
    // know the pre-edit value, so the previous hydration must supply the edit.
    act(() => {
      simulateDefaultsReset(result.current, defaults);
    });
    rerender({ calNames: CAL_NAMES, defaultFormValues: buildDefaults() });

    expect(result.current.getValues('calLabels')).toEqual([
      { name: 'Team', value: 'team-b' },
      { name: 'Service', value: '' },
    ]);
  });

  it('does not resurrect a CAL value the user deliberately cleared', () => {
    const defaults = buildDefaults();
    const { result, rerender } = setup(defaults);

    // Clearing a CAL value edits the row in place, so it is dirty and survives the reset.
    act(() => {
      result.current.setValue(
        'calLabels',
        [
          { name: 'Team', value: '' },
          { name: 'Service', value: '' },
        ],
        { shouldDirty: true }
      );
      simulateDefaultsReset(result.current, defaults);
    });

    rerender({ calNames: CAL_NAMES, defaultFormValues: buildDefaults() });

    expect(result.current.getValues('calLabels')).toEqual([
      { name: 'Team', value: '' },
      { name: 'Service', value: '' },
    ]);
  });

  it('moves a deconfigured CAL value back to the custom labels', () => {
    const defaults = buildDefaults();
    const { result, rerender } = setup(defaults);

    expect(result.current.getValues('calLabels')).toEqual([
      { name: 'Team', value: 'team-a' },
      { name: 'Service', value: '' },
    ]);

    // The tenant removes Team from the CAL names (the query refetches periodically).
    rerender({ calNames: ['Service'], defaultFormValues: defaults });

    expect(result.current.getValues('calLabels')).toEqual([{ name: 'Service', value: '' }]);
    expect(result.current.getValues('labels')).toEqual([
      { name: 'custom', value: 'my-value' },
      { name: 'Team', value: 'team-a' },
    ]);
  });
});
