import { runInNewContext } from 'vm';
import { decode } from 'js-base64';

import { ModuleKind, transpileModule } from 'typescript';

import { createBrokenLinksCheck } from './brokenLinks';

// Execute the generated script with k6 dependencies substituted, so these tests
// exercise its control flow rather than only matching generated source text.
function prepareScript(status: number | null) {
  const page = {
    goto: jest.fn().mockResolvedValue(status === null ? null : { status: () => status }),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const checkLinks = jest.fn().mockResolvedValue(undefined);
  const check = createBrokenLinksCheck(new URL('https://grafana.com/'), {});
  const script = decode(check.settings.browser.script);
  const exports = {} as { default: () => Promise<void> };
  const modules: Record<string, unknown> = {
    k6: {
      fail: (message: string) => {
        throw new Error(message);
      },
    },
    'k6/browser': { browser: { newPage: jest.fn().mockResolvedValue(page) } },
    'https://jslib.k6.io/sm-linkcheck/0.1.0/index.js': { checkLinks },
  };
  runInNewContext(transpileModule(script, { compilerOptions: { module: ModuleKind.CommonJS } }).outputText, {
    exports,
    require: (name: string) => {
      if (!(name in modules)) {
        throw new Error(`Unexpected import: ${name}`);
      }
      return modules[name];
    },
  });
  return { run: exports.default, page, checkLinks };
}

it.each([404, 500, 503, null])('fails before scanning links when the page returns %s', async (status) => {
  const { run, page, checkLinks } = prepareScript(status);
  await expect(run()).rejects.toThrow(
    `Page failed to load successfully: ${status === null ? 'no response' : `HTTP ${status}`}`
  );
  expect(checkLinks).not.toHaveBeenCalled();
  expect(page.close).toHaveBeenCalledTimes(1);
});

it('scans a successfully loaded page and applies the navigation timeout', async () => {
  const { run, page, checkLinks } = prepareScript(200);
  await run();
  expect(page.goto).toHaveBeenCalledWith('https://grafana.com/', { waitUntil: 'load', timeout: 30000 });
  expect(checkLinks).toHaveBeenCalledWith(page, {});
  expect(page.close).toHaveBeenCalledTimes(1);
});

it('closes the page if navigation throws', async () => {
  const { run, page, checkLinks } = prepareScript(200);
  page.goto.mockRejectedValue(new Error('Navigation timed out'));
  await expect(run()).rejects.toThrow('Navigation timed out');
  expect(checkLinks).not.toHaveBeenCalled();
  expect(page.close).toHaveBeenCalledTimes(1);
});
