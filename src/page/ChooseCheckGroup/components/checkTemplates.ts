import { IconName } from '@grafana/ui';
import { encode } from 'js-base64';

import { BrowserCheck, Check, CheckType } from 'types';
import { ONE_HOUR_IN_MS } from 'utils.constants';
import { DEFAULT_CHECK_CONFIG_MAP } from 'components/Checkster/constants';

export interface CheckTemplateDefinition {
  id: 'broken_links' | 'ssl_certificate';
  title: string;
  icon: IconName;
  description: string;
  urlDescription: string;
  checkType: CheckType;
  httpsOnly?: boolean;
  createCheck: (url: URL) => Check;
}

export const CHECK_TEMPLATES: CheckTemplateDefinition[] = [
  {
    id: 'broken_links',
    title: 'Detect broken links',
    icon: 'link-broken',
    description: 'Check a page for links that no longer work.',
    urlDescription: 'Check the links on a single page.',
    checkType: CheckType.Browser,
    createCheck: (url) => createBrowserCheck(url, `Broken links on ${url.hostname}`, createBrokenLinksScript(url.href)),
  },
  {
    id: 'ssl_certificate',
    title: 'Check SSL certificate',
    icon: 'lock',
    description: 'Detect expired SSL certificates and certificates nearing expiry.',
    urlDescription: 'Enter the HTTPS URL to check.',
    checkType: CheckType.Browser,
    httpsOnly: true,
    createCheck: (url) => createBrowserCheck(url, `SSL certificate for ${url.hostname}`, createSSLCertificateScript(url.href)),
  },
];

function createBrowserCheck(url: URL, job: string, script: string): BrowserCheck {
  const defaults = DEFAULT_CHECK_CONFIG_MAP[CheckType.Browser] as BrowserCheck;
  return {
    ...defaults,
    job,
    target: url.href,
    frequency: ONE_HOUR_IN_MS,
    settings: {
      browser: { ...defaults.settings.browser, script: encode(script) },
    },
  };
}

function createBrokenLinksScript(url: string) {
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
    await checkLinks(page);
  } finally {
    await page.close();
  }
}
`;
}

function createSSLCertificateScript(url: string) {
  return `import { browser } from 'k6/browser';
import sslcheck from 'https://jslib.k6.io/sm-sslcheck/0.1.0/index.js';

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
    const res = await page.goto(${JSON.stringify(url)});
    await sslcheck.checkCertificate(res, { warnDays: 30, failOnExpired: true, failOnNearExpiry: true });
  } finally {
    await page.close();
  }
}
`;
}
