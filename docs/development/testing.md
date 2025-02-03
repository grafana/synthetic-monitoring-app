# Testing strategy

We use `jest` with `react-testing-library` for testing our application. Our aim is to have a 'trophy'-shaped testing strategy, with a large number of integration tests and a smaller number of unit and e2e tests.

The general philosophy is aiming for the right balance of confidence in core user journeys whilst keeping our tests easy to maintain and fast to run and iterate upon. Unit tests are too closely tied to implementation details and can create friction to changing the fundamentals, e2e tests can take a long time to run and be difficult to set up an easy to reproduce environment. Integration tests are by no means perfect but they are a good compromise.

We will continually review our testing strategy and adjust as necessary.

## Silenced test errors

Because we try to emulate so much of the browser in our integration tests, alongside having a dependency on `grafana/grafana` and associated libraries we end up with somewhat noisy tests that generate errors and warnings that aren't very useful.

We have a file [`src/test/silenceErrors.ts`](../../src/test/silenceErrors.ts) that silences some of the more common errors that we see in our tests. This is a bit of a blunt instrument and has an unfortunate side effect of making the stack trace for useful errors in the test difficult to use, but it's better than having to wade through a sea of red text to find the actual test failures in the first place.

If you do need an accurate stack trace, temporarily comment out all of the `silenceErrors.ts` file and re-run the individual test(s) that you're interested in.
