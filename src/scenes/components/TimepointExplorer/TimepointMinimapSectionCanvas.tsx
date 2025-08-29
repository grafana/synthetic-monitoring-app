import React, { useLayoutEffect, useRef } from 'react';

import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useTimepointVizOptions } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  getCouldBePending,
  getIsInTheFuture,
  getPendingProbeNames,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { useStatefulTimepoints } from 'scenes/components/TimepointExplorer/TimepointMinimapSectionCanvas.hooks';
import {
  drawReachabilityTimepoint,
  drawUptimeTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointMinimapSectionCanvas.utils';

interface MinimapCanvasProps {
  timepoints: StatelessTimepoint[];
  width: number;
  height: number;
}

export const TimepointMinimapSectionCanvas = ({ timepoints, width, height }: MinimapCanvasProps) => {
  const { check, currentAdjustedTime, isLoading, timepointsDisplayCount, viewMode, yAxisMax, vizDisplay } =
    useTimepointExplorerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedProbeNames = useSceneVarProbes(check);
  const pendingVizOption = useTimepointVizOptions('pending');
  const successVizOption = useTimepointVizOptions('success');
  const failureVizOption = useTimepointVizOptions('failure');
  const missingVizOption = useTimepointVizOptions('missing');

  // Process stateful timepoints - replicate the useStatefulTimepoint logic
  const processedTimepoints = useStatefulTimepoints(timepoints);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set up high DPI rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = width;
    const displayHeight = height;

    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const entryWidth = width / timepointsDisplayCount;

    // Count renderable timepoints for right-alignment
    const renderableCount = processedTimepoints.filter((timepoint) => {
      const isInTheFuture = getIsInTheFuture(timepoint, currentAdjustedTime);
      const isEntryLoading = isLoading && timepoint.status === 'missing';
      return timepoint.config.type !== 'no-data' && !isInTheFuture && !isEntryLoading;
    }).length;

    // Start from right edge, accounting for the width needed for renderable timepoints
    const totalRenderWidth = renderableCount * entryWidth;
    let currentX = width - totalRenderWidth;

    processedTimepoints.forEach((statefulTimepoint) => {
      const isInTheFuture = getIsInTheFuture(statefulTimepoint, currentAdjustedTime);
      const isEntryLoading = isLoading && statefulTimepoint.status === 'missing';
      const couldBePending = getCouldBePending(statefulTimepoint, currentAdjustedTime);
      const pendingProbeNames = getPendingProbeNames({ statefulTimepoint, selectedProbeNames });

      if (statefulTimepoint.config.type === 'no-data' || isInTheFuture || isEntryLoading) {
        // Don't increment currentX for non-renderable timepoints since we're right-aligning
        return;
      }

      const vizOptionColors = {
        pending: pendingVizOption,
        success: successVizOption,
        failure: failureVizOption,
        missing: missingVizOption,
      };

      const props = {
        ctx,
        statefulTimepoint,
        x: currentX,
        width: entryWidth,
        canvasHeight: displayHeight,
        yAxisMax,
        vizDisplay,
        vizOptionColors,
      };

      if ((couldBePending && pendingProbeNames.length) || viewMode === 'uptime') {
        drawUptimeTimepoint(props);
      } else {
        drawReachabilityTimepoint(props);
      }

      currentX += entryWidth;
    });
  }, [
    currentAdjustedTime,
    failureVizOption,
    height,
    isLoading,
    missingVizOption,
    pendingVizOption,
    processedTimepoints,
    selectedProbeNames,
    successVizOption,
    timepointsDisplayCount,
    viewMode,
    vizDisplay,
    width,
    yAxisMax,
  ]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};
