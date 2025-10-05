import { useSplitter } from '@grafana/ui';

export function useAppSplitter() {
  return useSplitter({
    direction: 'row',
    initialSize: 0.7,
    dragPosition: 'middle',
    handleSize: 'md',
  });
}
