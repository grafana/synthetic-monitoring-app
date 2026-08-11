---
name: write-tests
description: Write Jest integration and unit tests for the Grafana Synthetic Monitoring app using React Testing Library, MSW, and src/test helpers. Use whenever the user asks to add, fix, or review tests, mentions yarn test, *.test.tsx, integration tests, user journeys, MSW handlers, fixtures, unhappy paths, or PR test coverage — even if they do not say "write tests" explicitly.
---

# Write tests for Synthetic Monitoring

Read [`docs/development/testing.md`](../../../docs/development/testing.md) first. That doc is the harness-agnostic source of truth for expectations and how-to. This skill is the agent workflow for applying it.

## Before writing anything

1. Read the testing doc (at minimum the Expectations section).
2. Find 1–2 nearby tests for the feature you are covering — match local conventions before inventing new patterns.
3. Open `src/test/handlers/index.ts` if you need to override or add API routes; open `src/test/fixtures/` for existing named data.

## Mental model

Our suite is a **pseudo e2e framework**: real UI, user journeys, mocked APIs. Integration tests carry the most weight. Unit tests are fine for pure logic but matter less than journey coverage.

## Expectations checklist

When adding or reviewing tests, verify:

- [ ] **New API?** Handler in `src/test/handlers/`, registered in `API_ROUTES`, fixtures/factories if needed — not inline JSON in every test.
- [ ] **UI / end-goal focused?** Assert what the user sees and achieves (copy, roles, navigation, disabled CTAs, redirects). Avoid testing implementation details.
- [ ] **Repeated journey?** Extract a small helper in `__testHelpers__/` next to the feature (see `checkForm.tsx`, `formHelpers.ts` for patterns).
- [ ] **Unhappy paths covered?** Errors, permissions, limits, validation — not just the happy path. Multi-step journeys should assert intermediate failure/success at each step.
- [ ] **Tests as docs?** Prefer tests over standalone docs. If testing is impractical, document behaviour instead and note it in the PR.

## When to write tests (timing)

- Propose TDD (tests first) when it fits the task.
- If the user rejects TDD, wait until the feature is PR-ready before writing tests — mid-exploration tests often blur requirements.
- Frontend engineers: full test depth expected. Others: OK to defer complex tests with a PR note asking an FE engineer to add them.

## Choose the right test type

| Situation                            | Approach                                                       |
| ------------------------------------ | -------------------------------------------------------------- |
| Component or page behaviour          | Integration test via `test/render`                             |
| Multi-step check wizard              | Journey helpers in `page/__testHelpers__/` + Checkster helpers |
| Pure function / adaptor / validation | Unit test, no custom render                                    |
| Hard to test (heavy upstream deps)   | Document behaviour; note in PR                                 |

## Integration test workflow

```tsx
import { screen } from '@testing-library/react';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { OFFLINE_PROBE } from 'test/fixtures/probes';

it('shows Offline for an offline probe', async () => {
  render(<Probe probe={OFFLINE_PROBE} />);
  expect(await screen.findByText('Offline')).toBeInTheDocument();
});
```

Rules:

- Tests are `async`; use `findBy*` / `findAllBy*` after render (network must settle).
- Use `user` from `render`, not `userEvent` directly.
- Override MSW with `server.use(apiRoute('routeKey', { result: () => ({ ... }) }))`.
- Assert API payloads with `getServerRequests()` when the journey submits data.
- Use `mockFeatureToggles` and `runTestAs*` from `test/utils` for flags and personas — not ad-hoc config mocks.
- Prefer stable fixtures (`test/fixtures/*`) over one-off `DB.build` unless you need a custom variant.

For routing, pass `path` and `route` to `render`. Assert navigation via `ROUTER_TEST_ID` from `test/dataTestIds`.

For hooks, use `createWrapper()` with `renderHook`.

## Verify

Run the file you changed:

```bash
yarn test <filename>
```

Fix failures before considering the work done.

## Do not

- Paste the full handler registry into tests or comments — reference `src/test/handlers/index.ts`.
- Add copious unit tests when a single integration test covers the user journey.
- Hand-roll provider stacks — use `test/render`.
- Skip unhappy-path coverage for a journey that has meaningful failure modes.
