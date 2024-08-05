import { BettererFileTest } from '@betterer/betterer';
import { ESLint, Linter } from 'eslint';
import path from 'path';

const srcPath = path.resolve(__dirname, '../src');

export default {
  'internationalization (i18n)': () => countEslintErrors().include('../src/**/*.{ts,tsx}'),
};

function countEslintErrors() {
  return new BettererFileTest(async (filePaths, fileTestResult, resolver) => {
    // Just bail early if there's no files to test. Prevents trying to get the base config from failing
    if (filePaths.length === 0) {
      return;
    }

    const { baseDirectory } = resolver;
    const cli = new ESLint({ cwd: baseDirectory });
    // console.log(filePaths);
    // Get the base config to set up parsing etc correctly
    // this is by far the slowest part of this code. It takes eslint about 2 seconds just to find the config
    const baseConfig = await cli.calculateConfigForFile(filePaths[0]);

    const config: Linter.Config = {
      ...baseConfig,
      overrides: [
        {
          files: ['*.ts', '*.tsx'],
          excludedFiles: ['*.d.ts'],
          rules: {
            '@grafana/no-untranslated-strings': 'error',
          },
        },
      ],
    };

    const runner = new ESLint({
      baseConfig: config,
      useEslintrc: false,
      cwd: baseDirectory,
    });

    const lintResults = await runner.lintFiles(Array.from(filePaths));
    lintResults
      .filter((lintResult) => lintResult.source)
      .forEach(({ messages, filePath }) => {
        console.log(baseDirectory);
        const file = fileTestResult.addFile(filePath, '');
        messages.forEach((message, index) => {
          file.addIssue(0, 0, message.message, `${index}`);
        });
      });

    console.log({
      baseDirectory,
    });
  });
}
