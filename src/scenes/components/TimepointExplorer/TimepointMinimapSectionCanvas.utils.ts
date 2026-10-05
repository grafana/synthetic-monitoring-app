import { colorManipulator } from '@grafana/data';

import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import { PARTIAL_FAILURE_SEGMENT_ALPHA } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  StatefulTimepoint,
  TimepointStatus,
  TimepointVizOption,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  getEntryHeight,
  getPartialFailureDisplayHeight,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface DrawTimepointProps {
  ctx: CanvasRenderingContext2D;
  statefulTimepoint: StatefulTimepoint;
  x: number;
  width: number;
  canvasHeight: number;
  yAxisMax: number;
  vizOptionColors: Record<TimepointStatus, TimepointVizOption>;
  vizDisplay: string[];
}

export function drawUptimeTimepoint({
  ctx,
  statefulTimepoint,
  x,
  width,
  canvasHeight,
  yAxisMax,
  vizDisplay,
  vizOptionColors,
}: DrawTimepointProps) {
  const { status, failureRatio } = statefulTimepoint;
  const vizOption = vizOptionColors[status];
  const showPartialFailure = failureRatio > 0 && failureRatio < 1 && vizDisplay.includes('failure');

  if (vizDisplay && !vizDisplay.includes(status) && !showPartialFailure) {
    return;
  }

  const heightPercent = getEntryHeight(statefulTimepoint.maxProbeDuration, yAxisMax);
  const height = (canvasHeight * heightPercent) / 100;
  const y = canvasHeight - height;

  ctx.fillStyle = vizOption.backgroundColor;
  ctx.strokeStyle = vizOption.border;
  ctx.lineWidth = 1;

  if (vizOption.backgroundColor !== 'transparent') {
    ctx.fillRect(x, y, width, height);
  }

  if (showPartialFailure && height > 0 && width > 0) {
    const failureHeight = getPartialFailureDisplayHeight(height, failureRatio);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, canvasHeight - failureHeight, width, failureHeight);
    ctx.clip();
    ctx.strokeStyle = colorManipulator.alpha(vizOptionColors.failure.statusColor, PARTIAL_FAILURE_SEGMENT_ALPHA);
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Center a stripe so a short failure segment still contains visible hatching.
    const stripeSpacing = 8 * Math.SQRT2;
    const centerOffset = (width - failureHeight) / 2;
    const firstStripe = Math.floor((-failureHeight - centerOffset) / stripeSpacing);
    for (let stripe = firstStripe; centerOffset + stripe * stripeSpacing <= width + 2; stripe++) {
      const offset = centerOffset + stripe * stripeSpacing;
      ctx.moveTo(x + offset, canvasHeight);
      ctx.lineTo(x + offset + failureHeight, canvasHeight - failureHeight);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (vizOption.border !== 'transparent') {
    ctx.strokeRect(x, y, width, height);
  }
}

export function drawReachabilityTimepoint({
  ctx,
  statefulTimepoint,
  x,
  width,
  canvasHeight,
  yAxisMax,
  vizDisplay,
  vizOptionColors,
}: DrawTimepointProps) {
  const executions = Object.values(statefulTimepoint.probeResults).flat();
  const containerWidth = width;
  const offset = containerWidth / 4;

  executions.forEach((execution) => {
    const probeSuccess = execution[LokiFieldNames.Labels].probe_success;
    const status = probeSuccess === '1' ? 'success' : 'failure';
    const vizOption = vizOptionColors[status];

    if (vizDisplay && !vizDisplay.includes(status)) {
      return;
    }

    const probeDuration = Number(execution[LokiFieldNames.Labels].duration_seconds) * 1000;
    const bottom = getEntryHeight(probeDuration, yAxisMax) / 100;
    const bottomInPx = canvasHeight * bottom - offset;
    const actualPosition = bottomInPx + offset > canvasHeight ? canvasHeight - offset : bottomInPx;
    const size = Math.max(width * 0.75, 1);
    const centerX = x + width / 2;
    const centerY = canvasHeight - actualPosition;
    const radius = size / 2;

    ctx.fillStyle = vizOption.backgroundColor;
    ctx.strokeStyle = vizOption.border;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

    if (vizOption.backgroundColor !== 'transparent') {
      ctx.fill();
    }
    if (vizOption.border !== 'transparent') {
      ctx.stroke();
    }
  });
}
