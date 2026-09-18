# Testing strategy

We use Jest with React Testing Library and MSW for testing this application. Our aim is to have a [trophy-shaped testing strategy](https://kentcdodds.com/blog/write-tests): a large number of integration tests, a smaller number of unit tests, and occasional true e2e tests.

## A pseudo e2e framework

Our Jest + RTL + MSW suite behaves like a **pseudo e2e framework**. Tests drive real UI through user journeys against mocked APIs — the same components, routing, and data-fetching paths users hit in production, without a live backend.

Browser-based e2e is more stable than it was a few years ago, but historically we were limited to headless `jest-dom`. The existing suite is built that way, and it remains where we invest by default. Playwright is not currently run in CI.

The general philosophy is the right balance of confidence in core user journeys whilst keeping tests easy to maintain and fast to run. Unit tests are too closely tied to implementation details and can create friction when changing fundamentals. True e2e tests can be slow and hard to reproduce locally. Integration tests are not perfect, but they are a good compromise.

We will continually review our testing strategy and adjust as necessary.

## Expectations

These are the rules we hold each other to when adding or changing tests.

### 1. New API → factories, fixtures, and handlers

If you add or change a backend surface, extend the test data layer. Do not hand-roll one-off JSON in every test file.

- **Fishery factories** in [`src/test/db/index.ts`](../../src/test/db/index.ts) — `DB.check`, `DB.probe`, `DB.alert`
- **Named fixtures** built from factories for stable, readable tests — e.g. [`src/test/fixtures/probes.ts`](../../src/test/fixtures/probes.ts) (`OFFLINE_PROBE`, `PRIVATE_PROBE`), [`src/test/fixtures/checks.ts`](../../src/test/fixtures/checks.ts) (`BASIC_HTTP_CHECK`, `BASIC_CHECK_LIST`)
- **MSW handlers** for the API route — e.g. [`src/test/handlers/secrets.ts`](../../src/test/handlers/secrets.ts), registered in [`src/test/handlers/index.ts`](../../src/test/handlers/index.ts)

When adding a new API, add a handler file (or extend an existing one), register it in `API_ROUTES`, and add fixtures if the default response needs named variants.

### 2. Tests are UI and end-goal focused

Assert what the user sees and achieves: copy, roles, navigation, disabled CTAs, success redirects. We care less about tests tied to implementation details.

Unit tests are welcome for pure logic (parsers, adaptors, validation). They hold less weight than journey coverage.

**Good examples:**

- [`src/page/EditProbe/EditProbe.test.tsx`](../../src/page/EditProbe/EditProbe.test.tsx) — edit a private probe, click save, assert redirect to the probes list and request body via `getServerRequests`
- Same file — public probes show "cannot be edited"; Save and Reset controls are absent
- [`src/page/ChooseCheckGroup/ChooseCheckGroup.test.tsx`](../../src/page/ChooseCheckGroup/ChooseCheckGroup.test.tsx) — check limit alert; HG Free over-execution disables create links

**Lower weight (still valid):** pure logic like [`src/components/Checkster/utils/adaptors.test.ts`](../../src/components/Checkster/utils/adaptors.test.ts).

Prefer tests as documentation for most features rather than lengthy standalone docs. If a feature is difficult to test, document its behaviour instead so we can cross-check manually. Unit tests plus documentation is a common combination; integration tests plus documentation is rare.

### 3. Shared journeys → small local testing helpers

When multiple tests share the same setup, extract a small helper next to the feature. Do not copy-paste render and MSW wiring across files.

- Check create/edit journey: [`src/page/__testHelpers__/checkForm.tsx`](../../src/page/__testHelpers__/checkForm.tsx) (`renderNewForm`, `renderEditForm`) and [`src/page/__testHelpers__/v2.utils.ts`](../../src/page/__testHelpers__/v2.utils.ts) (`fillMandatoryFields`)
- Checkster form steps: [`src/components/Checkster/__testHelpers__/formHelpers.ts`](../../src/components/Checkster/__testHelpers__/formHelpers.ts) (`gotoSection`, `submitForm`)
- Suite-local helpers are fine too — e.g. `renderChooseCheckGroup` in [`ChooseCheckGroup.test.tsx`](../../src/page/ChooseCheckGroup/ChooseCheckGroup.test.tsx), `renderEditProbe` in [`EditProbe.test.tsx`](../../src/page/EditProbe/EditProbe.test.tsx)

### 4. Unhappy paths weigh as much as happy paths

Every meaningful journey should cover failure, permission, and empty/error states — not only the green path. For multi-step journeys (e.g. Checkster wizards), assert intermediate failure and success at each step where behaviour differs.

**Examples:**

- API failure: [`SecretsManagementTab.test.tsx`](../../src/page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.test.tsx) — `listSecrets` returns 500 → "something went wrong" and a Retry button
- Permission denial: same file — viewer/editor without secrets access → contact admin message and required permissions listed
- Product limits: [`ChooseCheckGroup.test.tsx`](../../src/page/ChooseCheckGroup/ChooseCheckGroup.test.tsx) — check limit and monthly execution limit alerts
- Validation and partial failure: [`SecretEditModal.test.tsx`](../../src/page/ConfigPageLayout/tabs/SecretsManagementTab/SecretEditModal.test.tsx); Checkster payload and UI suites under [`src/page/NewCheck/__tests__/v2/`](../../src/page/NewCheck/__tests__/v2/)

### 5. When to write tests

Propose test-driven development when it fits — writing tests before the feature. If TDD is rejected, defer tests until the feature is ready for PR. Writing tests mid-exploration can blur requirements and slow iteration.

Frontend engineers are expected to write full test depth. Others may rely on help or note in the PR that a frontend engineer should add complex tests.

## Running tests

| Command                | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `yarn test`            | Run the full suite                                                      |
| `yarn test <filename>` | Run a single file or path fragment, e.g. `yarn test EditProbe.test.tsx` |
| `yarn test:changed`    | Watch mode, only changed files                                          |
| `yarn test:ci`         | CI configuration (passWithNoTests, limited workers)                     |
| `make test`            | Makefile alias for `yarn test`                                          |

The suite lives under `src/` as colocated `*.test.ts` / `*.test.tsx` files and in `__tests__/` folders for larger suites.

## Test infrastructure (`src/test/`)

Most integration test boilerplate lives in [`src/test/`](../../src/test/). It acts as a reliable e2e-style strategy because backend APIs are mocked.

| Module                                            | Purpose                                               |
| ------------------------------------------------- | ----------------------------------------------------- |
| [`render.tsx`](../../src/test/render.tsx)         | Custom render with app providers, router, OpenFeature |
| [`server.ts`](../../src/test/server.ts)           | MSW `setupServer` with default handlers               |
| [`handlers/`](../../src/test/handlers/)           | Typed route map; `apiRoute`, `getServerRequests`      |
| [`db/`](../../src/test/db/)                       | Fishery factories                                     |
| [`fixtures/`](../../src/test/fixtures/)           | Stable named entities                                 |
| [`utils.ts`](../../src/test/utils.ts)             | Role helpers, feature toggles, form/combobox helpers  |
| [`dataTestIds.ts`](../../src/test/dataTestIds.ts) | Shared `data-testid` constants                        |
| [`jest-setup.tsx`](../../src/test/jest-setup.tsx) | Server lifecycle, global mocks, observers             |

### Custom `render`

Import from `test/render`. It wraps the component in the same provider stack as the app (router, React Query, meta, feature flags, datasource, permissions, OpenFeature).

Because render waits on mocked network responses, tests must be `async` and use `await` with `findBy*` queries after render:

```tsx
import { screen } from '@testing-library/react';
import { render } from 'test/render';

it('toggles visibility of the probe cards', async () => {
  const { user } = render(<ProbeList probes={probes} title="Probes" />);

  const cards = await screen.findAllByText('Reachability');
  await user.click(cards[0]);
});
```

**Always use the `user` returned from `render`**, not `userEvent` directly.

**Routing:** pass `path` and `route` for page-level tests:

```tsx
render(<EditProbe />, {
  route: `${getRoute(AppRoutes.EditProbe)}/:id`,
  path: `${getRoute(AppRoutes.EditProbe)}/${probe.id}`,
});
```

Assert navigation via `ROUTER_TEST_ID` from `test/dataTestIds`.

**Hooks:** use `createWrapper()` with `renderHook`:

```tsx
const { Wrapper } = createWrapper();
const { result } = renderHook(() => useMyHook(), { wrapper: Wrapper });
```

### MSW: `server`, `apiRoute`, `getServerRequests`

Default handlers are registered in [`src/test/handlers/index.ts`](../../src/test/handlers/index.ts). Override per test with `server.use`:

```tsx
import { apiRoute, getServerRequests } from 'test/handlers';
import { server } from 'test/server';

// Override response data
server.use(
  apiRoute('listChecks', {
    result: () => ({ json: [] }),
  })
);

// Simulate API error
server.use(
  apiRoute('listSecrets', {
    result: () => ({ status: 500, body: 'Error message' }),
  })
);

// Record and assert request body
const { record, read } = getServerRequests();
server.use(apiRoute('updateProbe', {}, record));
// ... user actions ...
const { body } = await read();
expect(body).toMatchObject(expectedProbe);
```

Route keys match `API_ROUTES` in the handlers index (`listChecks`, `addCheck`, `updateProbe`, `listSecrets`, `getTenantLimits`, etc.).

### Fixtures vs factories

- **Fixtures** (`test/fixtures/*`) — stable, named entities for readable tests. Prefer these when a shared scenario already exists.

```tsx
import { OFFLINE_PROBE } from 'test/fixtures/probes';

it('shows Offline for an offline probe', async () => {
  render(<Probe probe={OFFLINE_PROBE} />);
  expect(await screen.findByText('Offline')).toBeInTheDocument();
});
```

- **DB factories** (`test/db`) — build custom variants with overrides and transient params:

```tsx
DB.check.build({ job: 'My HTTP check', target: 'https://example.com' }, { transient: { type: CheckType.Http } });
```

### Feature flags and personas

- **`mockFeatureToggles`** — sets Grafana config toggles and OpenFeature test flags. See also [openfeature-migration.md](./openfeature-migration.md).
- **`runTestAs*`** helpers in `test/utils` — simulate viewer, editor, admin, RBAC roles, secrets access, HG Free limits, etc. Prefer these over ad-hoc config mocks.

### Journey helpers (Checkster and check forms)

For multi-step check creation and editing, use the helpers under `src/page/__testHelpers__/` and `src/components/Checkster/__testHelpers__/`. Payload and UI test suites under `src/page/NewCheck/__tests__/v2/` are the reference for how to structure wizard coverage.

## File placement

Colocate tests with the code they cover: `{ComponentName}.test.tsx` next to `{ComponentName}.tsx`.

For large suites, split by concern — e.g. `CheckList.filters.test.tsx`, `CheckList.search.test.tsx` — or use a `__tests__/` folder.

## Silenced test errors

Because we emulate much of the browser in integration tests, alongside dependencies on `grafana/grafana` and associated libraries, tests generate errors and warnings that are not useful.

[`src/test/silenceErrors.ts`](../../src/test/silenceErrors.ts) filters common noise. This is a blunt instrument and can make stack traces for real failures harder to read, but it keeps failures visible.

If you need an accurate stack trace, temporarily comment out `silenceErrors.ts` and re-run the individual test(s).

## E2e vs integration

| Layer                 | Tool                 | When we use it                                                   |
| --------------------- | -------------------- | ---------------------------------------------------------------- |
| Integration (default) | Jest + RTL + MSW     | Most features; fast, reproducible, no Cloud credentials          |
| Unit                  | Jest                 | Pure functions, adaptors, validation                             |
| E2e                   | Cypress (`yarn e2e`) | Exists but not the primary investment; Playwright disabled in CI |

For local development with MSW mocks, use `yarn dev:msw`. If you switch between `yarn dev:msw` and `yarn dev`, unregister the MSW service worker in DevTools to avoid stale intercepts.
