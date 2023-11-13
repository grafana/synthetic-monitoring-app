// webpack.config.ts
import path from 'path';
import type { Configuration } from 'webpack';
import { CustomizeRule, mergeWithRules } from 'webpack-merge';

import { SOURCE_DIR } from './.config/webpack/constants';
import grafanaConfig from './.config/webpack/webpack.config';
const config = async (env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  const customConfig = {
    module: {
      rules: [
        {
          exclude: /(node_modules)/,
          test: /\.[tj]sx?$/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                baseUrl: path.resolve(process.cwd(), SOURCE_DIR),
                target: 'es2015',
                loose: false,
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                  decorators: false,
                  dynamicImport: true,
                },
              },
            },
          },
        },
      ],
    },
    output: {
      asyncChunks: true,
    },
  };

  const res = mergeWithRules({
    module: {
      rules: {
        test: CustomizeRule.Match,
        use: {
          loader: CustomizeRule.Match,
          options: CustomizeRule.Replace,
        },
      },
    },
  })(customConfig, baseConfig);

  return res;
};

export default config;
