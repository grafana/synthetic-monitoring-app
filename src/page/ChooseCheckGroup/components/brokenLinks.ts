import { encode } from 'js-base64';

import { BrowserCheck, CheckType } from 'types';
import { ONE_HOUR_IN_MS } from 'utils.constants';
import { DEFAULT_CHECK_CONFIG_MAP } from 'components/Checkster/constants';

export interface BrokenLinksOptions {
  maxLinks?: number;
  timeout?: string;
}

export function createBrokenLinksCheck(url: URL, options: BrokenLinksOptions): BrowserCheck {
  const defaults = DEFAULT_CHECK_CONFIG_MAP[CheckType.Browser] as BrowserCheck;
  return {
    ...defaults,
    // Check names allow at most 128 characters and cannot contain quotes or commas.
    job: `Detect broken links on ${url.href}`
      .replace(/[\x27",]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
      .slice(0, 128),
    target: url.href,
    frequency: ONE_HOUR_IN_MS,
    settings: { browser: { ...defaults.settings.browser, script: encode(createBrokenLinksScript(url.href, options)) } },
  };
}

function createBrokenLinksScript(url: string, linkOptions: BrokenLinksOptions) {
  return `import { browser } from 'k6/browser';
import { checkLinks } from 'https://jslib.k6.io/sm-linkcheck/0.1.0/index.js';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto(${JSON.stringify(url)}, { waitUntil: 'load' });
    await checkLinks(page, ${JSON.stringify(linkOptions, null, 2).replace(/\n/g, '\n    ')});
  } finally {
    await page.close();
  }
}
`;
}
