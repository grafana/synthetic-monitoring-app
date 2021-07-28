Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const consoleError = console.error;
global.console = {
  ...global.console,
  error: (e: Error) => {
    // The package react-inlinesvg is failing to load Grafana icons but the error
    // is harmless. Issue at: https://github.com/grafana/grafana/issues/37052
    if (e.stack?.includes('InlineSVG.getNode')) {
      // ignore
    } else {
      consoleError(e);
    }
  },
};
