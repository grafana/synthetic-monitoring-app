import { z } from 'zod';
import { PRIVATE_PROBE, PUBLIC_PROBE, UNSELECTED_PRIVATE_PROBE } from 'test/fixtures/probes';

import { type CheckFormValuesBrowser, type CheckFormValuesScripted, CheckType, type ProbeWithMetadata } from 'types';
import { EMPTY_METADATA } from 'components/CheckEditor/ProbesMetadata';

import { addRefinements } from './BaseCheckSchema';
import { createBrowserCheckSchema } from './BrowserCheckSchema';
import { createScriptedCheckSchema } from './ScriptedCheckSchema';

const mockProbes: ProbeWithMetadata[] = [
  {
    ...EMPTY_METADATA,
    ...PRIVATE_PROBE,
    displayName: PRIVATE_PROBE.name,
    k6Versions: {
      v0: '0.48.0',
      v1: '1.2.3',
      v2: null, // Not available on v2
    },
  },
  {
    ...EMPTY_METADATA,
    ...PUBLIC_PROBE,
    displayName: PUBLIC_PROBE.name,
    k6Versions: {
      v0: '0.48.0',
      v1: '1.2.3',
      v2: '2.0.1',
    },
  },
  {
    ...EMPTY_METADATA,
    ...UNSELECTED_PRIVATE_PROBE,
    displayName: UNSELECTED_PRIVATE_PROBE.name,
    k6Versions: {
      v0: '0.48.0',
      v1: '1.2.3',
    },
  },
];

describe('K6 Channel Validation', () => {
  describe('ScriptedCheckSchema', () => {
    const validScriptedCheck = {
      job: 'test',
      target: 'https://example.com',
      frequency: 60000,
      timeout: 10000,
      enabled: true,
      labels: [],
      probes: [1],
      alertSensitivity: 'none' as const,
      publishAdvancedMetrics: false,
      checkType: 'scripted' as const,
      settings: {
        scripted: {
          script: 'console.log("test");',
          channel: 'v1',
        },
      },
    };

    it('should pass validation when channel is enabled', () => {
      const schema = createScriptedCheckSchema();
      expect(() => schema.parse(validScriptedCheck)).not.toThrow();
    });

    it('should pass validation when channel is null', () => {
      const schema = createScriptedCheckSchema();
      const checkWithoutChannel = {
        ...validScriptedCheck,
        settings: {
          scripted: {
            ...validScriptedCheck.settings.scripted,
            channel: null,
          },
        },
      };

      expect(() => schema.parse(checkWithoutChannel)).not.toThrow();
    });
  });

  describe('ScriptedCheckSchema - Probe Compatibility', () => {
    const baseCheck: CheckFormValuesScripted = {
      job: 'test',
      target: 'https://example.com',
      frequency: 60000,
      timeout: 10000,
      enabled: true,
      labels: [],
      probes: [PRIVATE_PROBE.id!, PUBLIC_PROBE.id!],
      alertSensitivity: 'none' as const,
      publishAdvancedMetrics: false,
      checkType: CheckType.Scripted,
      settings: {
        scripted: {
          script: 'console.log("test");',
          channel: 'v1',
        },
      },
    };

    it('should pass validation when all selected probes are compatible with the channel', () => {
      const schema = createScriptedCheckSchema(mockProbes);
      const refinedSchema = addRefinements(schema);

      expect(() => refinedSchema.parse(baseCheck)).not.toThrow();
    });

    it('should fail validation when a selected probe is not compatible with the channel', () => {
      const checkWithIncompatibleProbe: CheckFormValuesScripted = {
        ...baseCheck,
        probes: [PRIVATE_PROBE.id!], // PRIVATE_PROBE doesn't have v2
        settings: {
          scripted: {
            script: 'console.log("test");',
            channel: 'v2',
          },
        },
      };

      const schema = createScriptedCheckSchema(mockProbes);
      const refinedSchema = addRefinements(schema);

      expect(() => refinedSchema.parse(checkWithIncompatibleProbe)).toThrow();
    });

    it('should show appropriate error message for incompatible probes', () => {
      const checkWithIncompatibleProbe: CheckFormValuesScripted = {
        ...baseCheck,
        probes: [PRIVATE_PROBE.id!],
        settings: {
          scripted: {
            script: 'console.log("test");',
            channel: 'v2',
          },
        },
      };

      const schema = createScriptedCheckSchema(mockProbes);
      const refinedSchema = addRefinements(schema);

      try {
        refinedSchema.parse(checkWithIncompatibleProbe);
        fail('Expected validation to throw');
      } catch (error) {
        if (error instanceof z.ZodError) {
          const probeError = error.issues.find((err) => err.path.includes('probes'));
          expect(probeError).toBeDefined();
          expect(probeError?.message).toContain(PRIVATE_PROBE.name);
          expect(probeError?.message).toContain('v2');
          expect(probeError?.message).toContain('not compatible');
        } else {
          fail('Expected ZodError');
        }
      }
    });

    it('should pass validation when channel is null (no validation needed)', () => {
      const checkWithoutChannel: CheckFormValuesScripted = {
        ...baseCheck,
        settings: {
          scripted: {
            script: 'console.log("test");',
            channel: null,
          },
        },
      };

      const schema = createScriptedCheckSchema(mockProbes);
      const refinedSchema = addRefinements(schema);

      expect(() => refinedSchema.parse(checkWithoutChannel)).not.toThrow();
    });

    it('should show multiple incompatible probes in error message', () => {
      const checkWithMultipleIncompatibleProbes: CheckFormValuesScripted = {
        ...baseCheck,
        probes: [PRIVATE_PROBE.id!, UNSELECTED_PRIVATE_PROBE.id!], // Neither has v2
        settings: {
          scripted: {
            script: 'console.log("test");',
            channel: 'v2',
          },
        },
      };

      const schema = createScriptedCheckSchema(mockProbes);
      const refinedSchema = addRefinements(schema);

      try {
        refinedSchema.parse(checkWithMultipleIncompatibleProbes);
        fail('Expected validation to throw');
      } catch (error) {
        if (error instanceof z.ZodError) {
          const probeError = error.issues.find((err) => err.path.includes('probes'));
          expect(probeError).toBeDefined();
          expect(probeError?.message).toContain(PRIVATE_PROBE.name);
          expect(probeError?.message).toContain(UNSELECTED_PRIVATE_PROBE.name);
        } else {
          fail('Expected ZodError');
        }
      }
    });

    it('should pass when no probes are provided to schema (no validation)', () => {
      const schema = createScriptedCheckSchema(); // No probes provided
      const refinedSchema = addRefinements(schema);

      const checkWithAnyChannel: CheckFormValuesScripted = {
        ...baseCheck,
        probes: [PRIVATE_PROBE.id!],
        settings: {
          scripted: {
            script: 'console.log("test");',
            channel: 'non-existent-channel',
          },
        },
      };

      expect(() => refinedSchema.parse(checkWithAnyChannel)).not.toThrow();
    });
  });

  describe('BrowserCheckSchema', () => {
    const validBrowserCheck = {
      job: 'test',
      target: 'https://example.com',
      frequency: 60000,
      timeout: 10000,
      enabled: true,
      labels: [],
      probes: [1],
      alertSensitivity: 'none' as const,
      publishAdvancedMetrics: false,
      checkType: 'browser' as const,
      settings: {
        browser: {
          script: `
            import { browser } from 'k6/browser';
            export const options = {
              scenarios: {
                ui: {
                  executor: 'shared-iterations',
                  options: {
                    browser: {
                      type: 'chromium',
                    },
                  },
                },
              },
            };
            export default async function () {
              const context = await browser.newContext();
              const page = await context.newPage();
              await page.goto('https://example.com');
              await page.close();
            }
          `,
          channel: 'v1',
        },
      },
    };

    it('should pass validation when channel is enabled', () => {
      const schema = createBrowserCheckSchema();
      expect(() => schema.parse(validBrowserCheck)).not.toThrow();
    });

    it('should pass validation when channel is null', () => {
      const schema = createBrowserCheckSchema();
      const checkWithoutChannel = {
        ...validBrowserCheck,
        settings: {
          browser: {
            ...validBrowserCheck.settings.browser,
            channel: null,
          },
        },
      };

      expect(() => schema.parse(checkWithoutChannel)).not.toThrow();
    });
  });

  describe('BrowserCheckSchema - Probe Compatibility', () => {
    const baseCheck: CheckFormValuesBrowser = {
      job: 'test',
      target: 'https://example.com',
      frequency: 60000,
      timeout: 10000,
      enabled: true,
      labels: [],
      probes: [PUBLIC_PROBE.id!], // PUBLIC_PROBE supports v2
      alertSensitivity: 'none' as const,
      publishAdvancedMetrics: false,
      checkType: CheckType.Browser,
      settings: {
        browser: {
          script: `
            import { browser } from 'k6/browser';
            export const options = {
              scenarios: {
                ui: {
                  executor: 'shared-iterations',
                  options: {
                    browser: {
                      type: 'chromium',
                    },
                  },
                },
              },
            };
            export default async function () {
              const page = await browser.newPage();
              await page.goto('https://example.com');
            }
          `,
          channel: 'v2',
        },
      },
    };

    it('should pass validation when selected probe is compatible with the channel', () => {
      const schema = createBrowserCheckSchema(mockProbes);
      const refinedSchema = addRefinements(schema);

      expect(() => refinedSchema.parse(baseCheck)).not.toThrow();
    });

    it('should fail validation when selected probe is not compatible with the channel', () => {
      const checkWithIncompatibleProbe: CheckFormValuesBrowser = {
        ...baseCheck,
        probes: [PRIVATE_PROBE.id!], // PRIVATE_PROBE doesn't have v2
      };

      const schema = createBrowserCheckSchema(mockProbes);
      const refinedSchema = addRefinements(schema);

      expect(() => refinedSchema.parse(checkWithIncompatibleProbe)).toThrow();
    });

    it('should show appropriate error message for incompatible browser check probes', () => {
      const checkWithIncompatibleProbe: CheckFormValuesBrowser = {
        ...baseCheck,
        probes: [PRIVATE_PROBE.id!, UNSELECTED_PRIVATE_PROBE.id!], // Neither supports v2
      };

      const schema = createBrowserCheckSchema(mockProbes);
      const refinedSchema = addRefinements(schema);

      try {
        refinedSchema.parse(checkWithIncompatibleProbe);
        fail('Expected validation to throw');
      } catch (error) {
        if (error instanceof z.ZodError) {
          const probeError = error.issues.find((err) => err.path.includes('probes'));
          expect(probeError).toBeDefined();
          expect(probeError?.message).toContain(PRIVATE_PROBE.name);
          expect(probeError?.message).toContain(UNSELECTED_PRIVATE_PROBE.name);
          expect(probeError?.message).toContain('v2');
        } else {
          fail('Expected ZodError');
        }
      }
    });

    it('should pass validation when channel is null (no validation needed)', () => {
      const checkWithoutChannel: CheckFormValuesBrowser = {
        ...baseCheck,
        settings: {
          browser: {
            script: baseCheck.settings.browser.script,
            channel: null,
          },
        },
      };

      const schema = createBrowserCheckSchema(mockProbes);
      const refinedSchema = addRefinements(schema);

      expect(() => refinedSchema.parse(checkWithoutChannel)).not.toThrow();
    });

    it('should pass when no probes are provided to schema (no validation)', () => {
      const schema = createBrowserCheckSchema(); // No probes provided
      const refinedSchema = addRefinements(schema);

      const checkWithAnyChannel: CheckFormValuesBrowser = {
        ...baseCheck,
        probes: [PRIVATE_PROBE.id!],
        settings: {
          browser: {
            script: baseCheck.settings.browser.script,
            channel: 'non-existent-channel',
          },
        },
      };

      expect(() => refinedSchema.parse(checkWithAnyChannel)).not.toThrow();
    });
  });
});
