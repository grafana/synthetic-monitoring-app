import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

import { getAssistantActionStyle } from './assistantActionStyles';

jest.mock('@emotion/css', () => ({
  css: jest.fn(() => 'assistant-action'),
}));

const theme = {
  colors: {
    secondary: { main: 'rgb(32, 36, 41)' },
    background: { canvas: 'rgb(4, 6, 8)' },
    text: { primary: 'rgb(185, 190, 198)' },
    emphasize: jest.fn(() => 'rgb(43, 46, 51)'),
  },
  shape: { radius: { default: '8px' } },
} as unknown as GrafanaTheme2;

describe('getAssistantActionStyle', () => {
  it('keeps its gradient border while the inner layer lightens on hover', () => {
    getAssistantActionStyle(theme);

    expect(css).toHaveBeenCalledWith(
      expect.objectContaining({
        background: 'none',
        '&::before': expect.objectContaining({
          background: 'linear-gradient(90deg, rgb(168, 85, 247), rgb(249, 115, 22))',
        }),
        '&:hover::after': {
          background: 'linear-gradient(rgb(43, 46, 51), rgb(43, 46, 51)), rgb(4, 6, 8)',
        },
      })
    );
  });
});
