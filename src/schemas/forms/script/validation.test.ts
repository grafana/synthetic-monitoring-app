import { RefinementCtx } from 'zod';

import { UNRESOLVABLE_SPREAD_MESSAGE, validateBrowserScript } from './validation';

const VALID_BROWSER_SCRIPT = `
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
}
`;

const SPREAD_OPTIONS_BROWSER_SCRIPT = `
import { browser } from 'k6/browser';

const defaultOptions = {
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

export const options = {
  ...defaultOptions,
  syntheticMonitoring: {
    job: 'my job',
  },
};

export default async function () {
  const page = await browser.newPage();
}
`;

const NESTED_SPREAD_OPTIONS_BROWSER_SCRIPT = `
import { browser } from 'k6/browser';

const browserOptions = {
  browser: {
    type: 'chromium',
  },
};

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: {
        ...browserOptions,
      },
    },
  },
};

export default async function () {
  const page = await browser.newPage();
}
`;

function runValidation(script: string) {
  const issues: Array<{ message?: string }> = [];
  const context = {
    addIssue: (issue: { message?: string }) => {
      issues.push(issue);
    },
    path: [],
  } as unknown as RefinementCtx;

  validateBrowserScript(script, context);

  return issues;
}

describe('validateBrowserScript', () => {
  it('passes for a valid browser script', () => {
    expect(runValidation(VALID_BROWSER_SCRIPT)).toEqual([]);
  });

  it('resolves a spread of a locally declared object in the exported options', () => {
    expect(runValidation(SPREAD_OPTIONS_BROWSER_SCRIPT)).toEqual([]);
  });

  it('resolves a spread of a locally declared object in a nested options object', () => {
    expect(runValidation(NESTED_SPREAD_OPTIONS_BROWSER_SCRIPT)).toEqual([]);
  });

  it('errors when a resolved spread is missing the chromium browser type', () => {
    const script = `
      import { browser } from 'k6/browser';

      const defaultOptions = {
        scenarios: {
          ui: {
            executor: 'shared-iterations',
          },
        },
      };

      export const options = {
        ...defaultOptions,
      };

      export default async function () {}
    `;

    expect(runValidation(script)).toEqual([
      expect.objectContaining({ message: 'Script must set the type to chromium in the browser options.' }),
    ]);
  });

  it('errors when a scenario from a resolved spread defines a duration', () => {
    const script = `
      import { browser } from 'k6/browser';

      const defaultOptions = {
        scenarios: {
          ui: {
            executor: 'shared-iterations',
            duration: '1m',
            options: {
              browser: {
                type: 'chromium',
              },
            },
          },
        },
      };

      export const options = {
        ...defaultOptions,
      };

      export default async function () {}
    `;

    expect(runValidation(script)).toEqual([
      expect.objectContaining({ message: "Script can't define a duration value for this check" }),
    ]);
  });

  it('lets later properties override earlier spreads', () => {
    const script = `
      import { browser } from 'k6/browser';

      const defaultOptions = {
        scenarios: {
          ui: {
            executor: 'shared-iterations',
          },
        },
      };

      export const options = {
        ...defaultOptions,
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

      export default async function () {}
    `;

    expect(runValidation(script)).toEqual([]);
  });

  it('lets an explicit scenario override one provided by a spread inside the scenarios object', () => {
    const script = `
      import { browser } from 'k6/browser';

      const defaultScenarios = {
        ui: {
          executor: 'shared-iterations',
          options: {},
        },
      };

      export const options = {
        scenarios: {
          ...defaultScenarios,
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

      export default async function () {}
    `;

    expect(runValidation(script)).toEqual([]);
  });

  it('errors when an explicit scenario overrides a valid one from a spread with invalid options', () => {
    const script = `
      import { browser } from 'k6/browser';

      const defaultScenarios = {
        ui: {
          executor: 'shared-iterations',
          options: {
            browser: {
              type: 'chromium',
            },
          },
        },
      };

      export const options = {
        scenarios: {
          ...defaultScenarios,
          ui: {
            executor: 'shared-iterations',
            options: {},
          },
        },
      };

      export default async function () {}
    `;

    expect(runValidation(script)).toEqual([
      expect.objectContaining({ message: 'Script must set the type to chromium in the browser options.' }),
    ]);
  });

  it('errors with a clear message when the exported options contain a spread it cannot resolve', () => {
    const script = `
      import { browser } from 'k6/browser';
      import { defaultOptions } from './config';

      export const options = {
        ...defaultOptions,
      };

      export default async function () {}
    `;

    expect(runValidation(script)).toEqual([expect.objectContaining({ message: UNRESOLVABLE_SPREAD_MESSAGE })]);
  });

  it('passes when an unresolvable spread is present but the browser options are explicitly defined', () => {
    const script = `
      import { browser } from 'k6/browser';
      import { defaultOptions } from './config';

      export const options = {
        ...defaultOptions,
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

      export default async function () {}
    `;

    expect(runValidation(script)).toEqual([]);
  });

  it('errors when the browser type is not chromium', () => {
    const script = VALID_BROWSER_SCRIPT.replace(`chromium`, `firefox`);

    expect(runValidation(script)).toEqual([
      expect.objectContaining({ message: 'Script must set the type to chromium in the browser options.' }),
    ]);
  });

  it('errors when the script does not export any options', () => {
    const script = `
      import { browser } from 'k6/browser';

      export default async function () {}
    `;

    expect(runValidation(script)).toEqual([
      expect.objectContaining({ message: 'Script does not export any options.' }),
    ]);
  });

  it('errors when a scenario defines a duration', () => {
    const script = VALID_BROWSER_SCRIPT.replace(
      `executor: 'shared-iterations',`,
      `executor: 'shared-iterations', duration: '1m',`
    );

    expect(runValidation(script)).toEqual([
      expect.objectContaining({ message: "Script can't define a duration value for this check" }),
    ]);
  });

  it('errors when a scenario defines vus > 1', () => {
    const script = VALID_BROWSER_SCRIPT.replace(
      `executor: 'shared-iterations',`,
      `executor: 'shared-iterations', vus: 2,`
    );

    expect(runValidation(script)).toEqual([
      expect.objectContaining({ message: "Script can't define vus > 1 for this check" }),
    ]);
  });

  it('errors when a scenario defines iterations > 1', () => {
    const script = VALID_BROWSER_SCRIPT.replace(
      `executor: 'shared-iterations',`,
      `executor: 'shared-iterations', iterations: 2,`
    );

    expect(runValidation(script)).toEqual([
      expect.objectContaining({ message: "Script can't define iterations > 1 for this check" }),
    ]);
  });

  it(`errors when the script does not import { browser } from 'k6/browser'`, () => {
    const script = `
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

      export default async function () {}
    `;

    expect(runValidation(script)).toEqual([
      expect.objectContaining({ message: "Script must import { browser } from 'k6/browser'" }),
    ]);
  });
});
