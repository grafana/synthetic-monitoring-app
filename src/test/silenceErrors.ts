// silence container query errors
const originalConsoleError = console.error;

const ignoreErrorsList = [
  `Could not parse CSS stylesheet`,
  `Using kebab-case for css properties in objects is not supported.`,
];

beforeAll(() => {
  console.error = (error) => {
    const errMessage = typeof error === 'string' ? error : error?.message;

    if (ignoreErrorsList.some((ignoreError) => errMessage?.includes(ignoreError))) {
      return;
    }

    originalConsoleError(error);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
