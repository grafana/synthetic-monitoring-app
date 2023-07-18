module.exports = {
  faro: {
    api: {
      pushMeasurement: jest.fn(() => console.log('hhhhhhiiiiii')),
      pushEvent: jest.fn(),
      pushError: jest.fn(),
    },
  },
};
