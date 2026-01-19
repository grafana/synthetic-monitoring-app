import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import {
  StatefulTimepoint,
  TimepointStatus,
  TimepointVizOption,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

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
  const { status } = statefulTimepoint;
  const vizOption = vizOptionColors[status];

  if (vizDisplay && !vizDisplay.includes(status)) {
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
