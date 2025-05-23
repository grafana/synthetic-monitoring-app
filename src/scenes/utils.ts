export function getMinStepFromFrequency(ms?: number, incrementFactor?: number): string {
  const frequencyVal = (ms ?? 600000) / 1000 / 60; // turn ms to minutes
  let minStep = Math.max(Math.floor(frequencyVal), 1);
  if (incrementFactor) {
    minStep = minStep * incrementFactor;
  }
  return `${minStep}m`;
}

export function correctSceneVariableInterpolation(input: string) {
  return input.replace(/(\w+)=~"\{([^}]+)\}"/g, (_, key, values) => `${key}=~"${values.split(',').join('|')}"`);
}
