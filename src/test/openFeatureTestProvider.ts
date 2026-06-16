const testFlagValues: Record<string, boolean> = {};

export function getTestFlagValues(): Record<string, boolean> {
  return testFlagValues;
}

export function setTestFlag(key: string, value: boolean) {
  testFlagValues[key] = value;
}

export function resetTestFlags() {
  for (const key of Object.keys(testFlagValues)) {
    delete testFlagValues[key];
  }
}
