// Mutable map of OpenFeature flag key -> value, written by mockFeatureToggles and
// read by the test render wrappers, which pass it to the SDK's <OpenFeatureTestProvider>.
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
