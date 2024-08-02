import { BettererFileTest } from '@betterer/betterer';
import { ESLint, Linter } from 'eslint';


export default {
  'better eslint': () => countEslintErrors().include('**/*.{ts,tsx}')
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

    const baseRules: Partial<Linter.RulesRecord> = {};

    const config: Linter.Config = {
      ...baseConfig,
      rules: baseRules,

      // Be careful when specifying overrides for the same rules as in baseRules - it will... override
      // the same rule, not merge them with different configurations
      overrides: [
        {
          files: ['**/*.{ts,tsx}'],
          excludedFiles: ['**/*.d.ts'],
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
          file.addIssue(0, 0, message.message, `${index}`);
        });
      });
  });
}
