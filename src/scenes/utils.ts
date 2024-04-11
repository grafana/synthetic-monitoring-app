export function getMinStepFromFrequency(ms?: number): string {
  const frequencyVal = (ms ?? 600000) / 1000 / 60; // turn ms to minutes
  const minStep = `${Math.max(Math.floor(frequencyVal), 1)}m`;
  return minStep;
}
