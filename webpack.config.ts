// webpack.config.ts
import path from 'path';
import { type Configuration, DefinePlugin } from 'webpack';
import { CustomizeRule, mergeWithRules } from 'webpack-merge';

import { getPluginJson } from './.config/webpack/utils';
import grafanaConfig from './.config/webpack/webpack.config';

const config = async (env): Promise<Configuration> => {
  const pluginJson = getPluginJson();
  const baseConfig = await grafanaConfig(env);
  const customConfig = {
    module: {
      rules: [
        {
          exclude: /(node_modules)/,
          test: /\.[tj]sx?$/,
          resourceQuery: { not: [/raw/] },
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                baseUrl: path.join(__dirname, './src'),
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
        {
          resourceQuery: /raw/,
          type: 'asset/source',
        },
      ],
    },
    plugins: [
      new DefinePlugin({
        'process.env.REACT_APP_MSW': JSON.stringify(process.env.REACT_APP_MSW),
      }),
    ],
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
  })(customConfig, baseConfig, {
    output: {
      asyncChunks: true,
      publicPath: `public/plugins/${pluginJson.id}/`,
      chunkFilename: (pathData) => {
        const { chunk } = pathData;
        const { id, contentHash } = chunk;
        return `${id}.${contentHash.javascript}.js`;
      },
      uniqueName: pluginJson.id,
    },
    optimization: {
      chunkIds: 'named',
      splitChunks: {
        cacheGroups: {
          // bundle vendors with lazy module when possible
          // Grafana's cache busting strategy means splitting out vendor chunks does nothing
          defaultVendors: false,
        },
      },
    },
  });

  return res;
};

// eslint-disable-next-line no-restricted-syntax
export default config;
