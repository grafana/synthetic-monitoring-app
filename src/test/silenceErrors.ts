/* eslint-disable no-console */
const originalConsoleError = console.error;

const ignoreErrorsList = [
  `Could not parse CSS stylesheet`, // silence container query errors
  `Warning: Received \`%s\` for a non-boolean attribute \`%s\``, // should be fixed upstream
  `Warning: validateDOMNesting(...): %s cannot appear as a descendant of <%s>.%s`, // probecard - card.meta in grafana/grafana is a paragraph tag
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
