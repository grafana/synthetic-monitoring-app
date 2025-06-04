import { correctSceneVariableInterpolation } from './utils';

describe('correctSceneVariableInterpolation', () => {
  describe(`returns the same input if it's correct`, () => {
    it('when there is a single probe', () => {
      const input = `probe_success{job="some job", instance="some instance", probe=~"correct probe"}`;

      expect(correctSceneVariableInterpolation(input)).toBe(input);
    });

    it('when it uses all probes', () => {
      const input = `probe_success{job="some job", instance="some instance", probe=~".*"}`;

      expect(correctSceneVariableInterpolation(input)).toBe(input);
    });
  });

  describe(`corrects wrong interpolation`, () => {
    it('should correct multiple probes', () => {
      const input = `probe_success{job="some job", instance="some instance", probe=~"{incorrect probe1,incorrect probe2}"}`;
      const output = `probe_success{job="some job", instance="some instance", probe=~"incorrect probe1|incorrect probe2"}`;

      expect(correctSceneVariableInterpolation(input)).toBe(output);
    });

    it('should correct multiple jobs and probes', () => {
      const input = `probe_success{job=~"{incorrect job1,incorrect job2}", instance="some instance", probe=~"{incorrect probe1,incorrect probe2}"}`;
      const output = `probe_success{job=~"incorrect job1|incorrect job2", instance="some instance", probe=~"incorrect probe1|incorrect probe2"}`;

      expect(correctSceneVariableInterpolation(input)).toBe(output);
    });
  });
});
