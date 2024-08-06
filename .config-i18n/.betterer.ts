import { BettererFileTest } from '@betterer/betterer';
import { ESLint, Linter } from 'eslint';

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
        const file = fileTestResult.addFile(filePath, '');
        messages.forEach((message, index) => {
          // TODO: add some sort of unique identifier to the issue
          // currently if you have an existing issue, remove the existing one then add a new one
          // this is allowed because it didn't get 'worse'
          // if the issues had unique identifiers it would get flagged as worse in the above scenario
          // the trick is working out how to identify them so they endure
          // when the same issue's line / col number changes
          file.addIssue(0, 0, message.message, `${index}`);
        });
      });
  });
}
