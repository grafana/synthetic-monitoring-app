import { SceneVariable } from '@grafana/scenes';

export function getCheckTypeTitle(variable: SceneVariable | undefined, suffix = ''): string {
  if (!variable) {
    return `All${suffix}`;
  }

  // @ts-expect-error - value and text are not in the base type
  const value = variable.state.value;
  // @ts-expect-error
  const text = variable.state.text;

  // Check if "All" is selected
  if (value === '$__all' || value?.includes?.('$__all') || text === 'All') {
    return `All${suffix}`;
  }

  // Return the display text if available, otherwise the value
  const displayValue = text || value || 'All';
  return `${displayValue}${suffix}`;
}
