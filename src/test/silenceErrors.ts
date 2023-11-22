// silence container query errors
const originalConsoleError = Object.assign({}, console.error);

beforeAll(() => {
  console.error = () => {};
});

afterAll(() => {
  console.error = originalConsoleError;
});
