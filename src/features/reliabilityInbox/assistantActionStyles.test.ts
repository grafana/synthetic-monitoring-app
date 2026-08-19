import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

import { getAssistantActionStyle } from './assistantActionStyles';

jest.mock('@emotion/css', () => ({
  css: jest.fn(() => 'assistant-action'),
}));

const theme = {
  colors: {
    secondary: {
      main: 'rgb(34, 37, 43)',
    },
    text: {
      primary: 'rgb(204, 204, 220)',
    },
  },
} as GrafanaTheme2;

describe('getAssistantActionStyle', () => {
  it('keeps the assistant gradient background on hover', () => {
    getAssistantActionStyle(theme);

    const background =
      'linear-gradient(rgb(34, 37, 43), rgb(34, 37, 43)) padding-box, linear-gradient(90deg, rgb(168, 85, 247), rgb(249, 115, 22)) border-box';

    expect(css).toHaveBeenCalledWith(
      expect.objectContaining({
        background,
        '&&:hover': {
          background,
        },
      })
    );
  });
});
