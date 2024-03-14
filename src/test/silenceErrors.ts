// silence container query errors
const originalConsoleError = console.error;

beforeAll(() => {
  console.error = (error) => {
    if (error.message === `Could not parse CSS stylesheet`) {
      return;
    }

    originalConsoleError(error);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
