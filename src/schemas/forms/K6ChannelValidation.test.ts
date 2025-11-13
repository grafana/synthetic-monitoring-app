import { K6Channel } from 'types';

import { createBrowserCheckSchema } from './BrowserCheckSchema';
import { createScriptedCheckSchema } from './ScriptedCheckSchema';

describe('K6 Channel Validation', () => {
  const mockK6Channels: K6Channel[] = [
    {
      id: 'enabled-channel',
      name: 'enabled',
      default: false,
      deprecatedAfter: '2025-12-31T00:00:00Z',
      manifest: 'k6>=1,k6<2',
    },
  ];

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
          channel: 'enabled-channel',
        },
      },
    };

    it('should pass validation when channel is enabled', () => {
      const schema = createScriptedCheckSchema(mockK6Channels);
      expect(() => schema.parse(validScriptedCheck)).not.toThrow();
    });

    it('should pass validation when channel is null', () => {
      const schema = createScriptedCheckSchema(mockK6Channels);
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
          channel: 'enabled-channel',
        },
      },
    };

    it('should pass validation when channel is enabled', () => {
      const schema = createBrowserCheckSchema(mockK6Channels);
      expect(() => schema.parse(validBrowserCheck)).not.toThrow();
    });

    it('should pass validation when channel is null', () => {
      const schema = createBrowserCheckSchema(mockK6Channels);
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
});
