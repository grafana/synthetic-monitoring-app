export function getTextOffset(marker: number, markerCount: number) {
  const maxValue = 50;

  if (markerCount === 1) {
    return 0;
  }

  const step = (2 * maxValue) / (markerCount - 1);
  const offset = -maxValue + marker * step;
  return Math.round(offset * -100) / 100;
}
