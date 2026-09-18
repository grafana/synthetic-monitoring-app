import { IconName } from '@grafana/ui';

export interface BrowserCheckTemplateDefinition {
  id: 'broken_links' | 'ssl_certificate';
  title: string;
  icon: IconName;
  description: string;
  urlDescription: string;
  jobPrefix: string;
  httpsOnly?: boolean;
  createScript: (url: string) => string;
}

export const BROWSER_CHECK_TEMPLATES: BrowserCheckTemplateDefinition[] = [
  {
    id: 'broken_links',
    title: 'Detect broken links',
    icon: 'link-broken',
    description: 'Check a page for links that no longer work.',
    urlDescription: 'Check the links on a single page.',
    jobPrefix: 'Broken links on',
    createScript: createBrokenLinksScript,
  },
  {
    id: 'ssl_certificate',
    title: 'Check SSL certificate',
    icon: 'lock',
    description: 'Detect expired SSL certificates and certificates nearing expiry.',
    urlDescription: 'Enter the HTTPS URL to check.',
    jobPrefix: 'SSL certificate for',
    httpsOnly: true,
    createScript: createSSLCertificateScript,
  },
];

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
