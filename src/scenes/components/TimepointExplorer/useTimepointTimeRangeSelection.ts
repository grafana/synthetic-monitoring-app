import { useCallback, useState } from 'react';
import { dateTime, TimeRange } from '@grafana/data';

import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

interface UseTimepointTimeRangeSelectionProps {
  timepoints: StatelessTimepoint[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  timepointWidth: number;
  gapPx: number;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  containerClassName?: string;
}

interface SelectionState {
  startX: number;
  currentX: number;
  isSelecting: boolean;
}

export const ZOOM_DRAG_CLASS_NAME = 'zoom-drag';

export function useTimepointTimeRangeSelection({
  timepoints,
  containerRef,
  timepointWidth,
  gapPx,
  onTimeRangeChange,
}: UseTimepointTimeRangeSelectionProps) {
  const [selection, setSelection] = useState<SelectionState>({
    startX: 0,
    currentX: 0,
    isSelecting: false,
  });

  const getTimepointFromX = useCallback(
    (x: number): StatelessTimepoint | null => {
      if (!containerRef.current || timepoints.length === 0) {
        return null;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = x - rect.left;
      const totalWidth = timepointWidth + gapPx;
      const index = Math.floor(relativeX / totalWidth);
      
      if (index < 0 || index >= timepoints.length) {
        return null;
      }

      return timepoints[index];
    },
    [containerRef, timepoints, timepointWidth, gapPx]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only handle left mouse button
      if (e.button !== 0) {
        return;
      }

      e.preventDefault();
      
      // Add zoom-drag class to container
      if (containerRef.current) {
        containerRef.current.classList.add(ZOOM_DRAG_CLASS_NAME);
      }
      
      setSelection({
        startX: e.clientX,
        currentX: e.clientX,
        isSelecting: true,
      });
      
      const onMouseUp = () => {
        if (containerRef.current) {
          containerRef.current.classList.remove(ZOOM_DRAG_CLASS_NAME);
        }
        document.removeEventListener('mouseup', onMouseUp, true);
      };
      
      document.addEventListener('mouseup', onMouseUp, true);
    },
    [containerRef]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selection.isSelecting) {
        return;
      }

      setSelection((prev) => ({
        ...prev,
        currentX: e.clientX,
      }));
    },
    [selection.isSelecting]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selection.isSelecting) {
        return;
      }

      const minDragDistance = 10; // Minimum pixels to consider it a drag
      const dragDistance = Math.abs(selection.currentX - selection.startX);

      if (dragDistance < minDragDistance) {
        setSelection({ startX: 0, currentX: 0, isSelecting: false });
        return;
      }

      const startTimepoint = getTimepointFromX(Math.min(selection.startX, selection.currentX));
      const endTimepoint = getTimepointFromX(Math.max(selection.startX, selection.currentX));

      if (startTimepoint && endTimepoint) {
        const fromTime = startTimepoint.adjustedTime;
        const toTime = endTimepoint.adjustedTime + endTimepoint.timepointDuration;

        onTimeRangeChange({
          from: dateTime(fromTime),
          to: dateTime(toTime),
          raw: {
            from: dateTime(fromTime),
            to: dateTime(toTime),
          },
        });
      }

      setSelection({ startX: 0, currentX: 0, isSelecting: false });
    },
    [selection, getTimepointFromX, onTimeRangeChange]
  );

  const handleMouseLeave = useCallback(() => {
    if (selection.isSelecting) {
      setSelection({ startX: 0, currentX: 0, isSelecting: false });
    }
  }, [selection.isSelecting]);

  return {
    selection,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
}
