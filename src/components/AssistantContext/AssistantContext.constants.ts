import { type ChatContextItem, createAssistantContextItem, type Question } from '@grafana/assistant';

import { PLUGIN_URL_PATH } from 'routing/constants';
import { AppRoutes } from 'routing/types';

/**
 * Routes that are intentionally not registered with the Grafana Assistant
 * because they have no user-facing surface area (they immediately redirect
 * elsewhere on mount; see SceneRedirecter).
 */
export const ASSISTANT_CONTEXT_EXCLUDED_ROUTES: ReadonlySet<AppRoutes> = new Set([
  AppRoutes.Redirect,
  AppRoutes.Scene,
]);

interface AssistantPageContextEntry {
  /** Stable id used for diffing the registration list in tests. */
  id: string;
  /** The AppRoutes value this entry covers. Used by the coverage test. */
  route: AppRoutes;
  /**
   * URL pattern matched against `window.location.pathname` by the Assistant SDK.
   * Regex is used wherever a route has path params, so that, e.g.,
   * `/checks/:id` does not accidentally also match `/checks/:id/edit`.
   */
  urlPattern: string | RegExp;
  /**
   * Factory that builds the context items for this page. A factory (rather
   * than a static array) keeps the items lazily constructed so the Assistant
   * SDK is only invoked when a consumer needs the value.
   */
  createContextItems: () => ChatContextItem[];
  /**
   * Optional factory that builds starter questions for this page. These
   * surface as clickable prompts in the Assistant UI to help users discover
   * what they can ask. Bracketed `[placeholders]` are intentional — Assistant
   * pre-fills the chat input with the prompt so the user can edit before
   * sending.
   */
  createQuestions?: () => Question[];
}

function structured(
  title: string,
  data: {
    name: string;
    pageType: string;
    capabilities: string[];
    help: string;
  }
): ChatContextItem {
  return createAssistantContextItem('structured', {
    title,
    bypassLimits: true,
    data,
  });
}

/**
 * Builds a `structured` context item that is sent to the LLM but does NOT
 * appear as a visible chip in the Assistant UI. Useful for rules-of-the-road
 * that should always influence the model's answer without cluttering the UI.
 */
function hiddenStructured(name: string, data: Record<string, unknown>): ChatContextItem {
  return createAssistantContextItem('structured', {
    title: name,
    hidden: true,
    bypassLimits: true,
    data: { name, ...data },
  });
}

function question(title: string, prompt: string): Question {
  return { title, prompt };
}

/**
 * Hidden context attached to any page where Assistant is likely to draft or
 * edit a k6 script for Synthetic Monitoring. Tools like `k6-authoring` are
 * perf-testing oriented and emit load-test-shaped scripts; this context tells
 * the model loudly to transform tool output to the SM single-VU model before
 * presenting it to the user.
 */
function smK6Conventions(): ChatContextItem {
  return hiddenStructured('Synthetic Monitoring k6 conventions', {
    pageType: 'sm-k6-conventions',
    audience: 'k6-script-authoring',
    summary:
      'This script is for Grafana Synthetic Monitoring (single-VU probe check on a recurring schedule), NOT k6 load testing.',
    rules: [
      `DO use the k6-testing assertions library — \`import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js';\` — for assertions. Reference: ${DOC_URLS.k6Assertions}. A failing expect() aborts the iteration, which directly maps to "SM check failed". This is the modern, recommended approach.`,
      'For protocol-level checks (HTTP/DNS/TCP/gRPC scripted), use the non-retrying matchers: expect(res.status).toBe(200), expect(res.body).toContain("..."), expect(data.field).toBeDefined(), etc.',
      'For browser checks, use the auto-retrying matchers on locators to handle async DOM: await expect(page.locator(...)).toBeVisible(), .toHaveText(...), .toHaveValue(...), etc. These wait for the condition rather than evaluating once.',
      'AVOID the classic k6 `check()` function for SM. check() is designed for load tests — it records a metric and CONTINUES execution on failure, which does not cleanly map to "the SM check failed". Prefer expect() for fail-fast semantics.',
      "DO NOT include options.stages, options.vus, options.thresholds, or other load-test ramping/SLO constructs — execution is single-VU at the check's configured frequency.",
      'DO NOT call exec.test.abort() or other load-test lifecycle APIs that do not apply to SM.',
      'DO reference credentials via the SM Secrets module (Config > Secrets tab in the Synthetic Monitoring app), NOT hardcoded strings or env vars.',
      "DO keep total execution time within the check's configured timeout. Use sleep() sparingly.",
      'DO emit custom Trend/Counter/Gauge metrics if useful for observability, but the primary pass/fail signal is the result of expect() assertions.',
      'AVOID heavyweight third-party perf-testing helpers that do not fit a tight per-execution budget.',
      'DO NOT suggest capturing screenshots (e.g. `page.screenshot()`) in browser checks. Screenshot capture is not currently functional for Synthetic Monitoring — the screenshots are produced by the script but cannot be viewed by the user in the SM UI. A fix is in progress; until it ships, do not direct users down this path. If a user explicitly asks about screenshots, acknowledge it is on the roadmap but not yet available rather than walking through page.screenshot() usage.',
    ],
    warning:
      'Tools such as k6-authoring are oriented toward performance testing and tend to emit load-test-shaped scripts (stages, VUs, thresholds, env-var credentials, classic check() calls, page.screenshot() debug aids). When using their output for a Grafana Synthetic Monitoring check, TRANSFORM the script to follow the rules above before presenting it to the user — including swapping check() calls for expect() from the k6-testing library and stripping any screenshot calls.',
  });
}

const DOC_URLS = {
  privateProbes:
    'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/',
  perCheckAlerts:
    'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/configure-alerts/configure-per-check-alerts/',
  k6Assertions: 'https://grafana.com/docs/k6/latest/using-k6/assertions/',
};

const root = PLUGIN_URL_PATH.replace(/\/$/, '');

// Pre-built regex fragments so the route shape is obvious at the call site.
const escapedRoot = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const checkIdRegex = new RegExp(`^${escapedRoot}/checks/[^/]+$`);
const editCheckRegex = new RegExp(`^${escapedRoot}/checks/[^/]+/edit$`);
// /checks/choose-type and the bare /checks/new index render the same component.
const chooseCheckGroupRegex = new RegExp(`^${escapedRoot}/checks/(choose-type|new)$`);
const newCheckApiRegex = new RegExp(`^${escapedRoot}/checks/new/api-endpoint$`);
const newCheckMultiStepRegex = new RegExp(`^${escapedRoot}/checks/new/multistep$`);
const newCheckScriptedRegex = new RegExp(`^${escapedRoot}/checks/new/scripted$`);
const newCheckBrowserRegex = new RegExp(`^${escapedRoot}/checks/new/browser$`);
const probeIdRegex = new RegExp(`^${escapedRoot}/probes/[^/]+$`);
const editProbeRegex = new RegExp(`^${escapedRoot}/probes/[^/]+/edit$`);

export const ASSISTANT_PAGE_CONTEXTS: readonly AssistantPageContextEntry[] = [
  {
    id: 'sm-home',
    route: AppRoutes.Home,
    urlPattern: `${root}/home`,
    createContextItems: () => [
      structured('Synthetic Monitoring home', {
        name: 'Synthetic Monitoring home',
        pageType: 'sm-home',
        capabilities: ['getting-started', 'navigation', 'overview'],
        help: 'The Synthetic Monitoring home page summarises the user\'s checks, probe usage, and recent activity. Help with: getting started, understanding what Synthetic Monitoring is, navigating to checks/probes/alerts, and choosing which type of check to create first.',
      }),
    ],
    createQuestions: () => [
      question(
        'Get started with Synthetic Monitoring',
        "I'm new to Synthetic Monitoring. Walk me through the key concepts (checks, probes, jobs) and help me decide what to create first."
      ),
      question(
        'What check type should I use?',
        'Help me choose between API endpoint checks, multi-step checks, k6 scripted checks, and k6 browser checks for a typical web application.'
      ),
      question(
        'Show me example use cases',
        'Give me 3-4 example monitoring use cases that Synthetic Monitoring is well-suited for, with the recommended check type for each.'
      ),
    ],
  },
  {
    id: 'sm-check-list',
    route: AppRoutes.Checks,
    urlPattern: `${root}/checks`,
    createContextItems: () => [
      structured('Synthetic Monitoring checks list', {
        name: 'Checks list',
        pageType: 'sm-check-list',
        capabilities: ['filter-checks', 'explain-statuses', 'explain-check-types'],
        help: 'Lists all synthetic monitoring checks for the current tenant. Users can filter by check type, status, label, or search by job/instance. Help with: interpreting success/failure/disabled statuses, filtering and searching, bulk actions, and finding specific checks.',
      }),
    ],
    createQuestions: () => [
      question(
        'Explain the statuses',
        'What do the success, failure, and disabled statuses on this list mean, and what causes each?'
      ),
      question('Filter and find a check', 'How do I filter this list to find a check by label, status, or check type?'),
      question(
        'Organize checks at scale',
        'What are best practices for organising and labelling checks across teams and services?'
      ),
    ],
  },
  {
    id: 'sm-choose-check-group',
    route: AppRoutes.ChooseCheckGroup,
    urlPattern: chooseCheckGroupRegex,
    createContextItems: () => [
      structured('Choose check type', {
        name: 'Choose check type',
        pageType: 'sm-choose-check-group',
        capabilities: ['explain-check-types', 'recommend-check-type'],
        help: 'User is picking which kind of synthetic check to create: API (HTTP, DNS, TCP, gRPC), Ping, Traceroute, k6 scripted, or k6 browser. Help with: which check type fits a given monitoring goal, the trade-offs between scripted and protocol-level checks, and when to choose browser checks.',
      }),
    ],
    createQuestions: () => [
      question(
        'Help me pick the right check type',
        'Help me pick the right check type. Ask me a few questions about what I want to monitor, then recommend between API endpoint, multi-step, k6 scripted, and k6 browser.'
      ),
      question(
        'HTTP check vs k6 script',
        'What are the trade-offs between a protocol-level HTTP check and a k6 scripted check? When does scripting become necessary?'
      ),
      question(
        'Browser vs scripted',
        'Explain the difference between k6 scripted and k6 browser checks. When do I need a real browser?'
      ),
    ],
  },
  {
    id: 'sm-new-check-api',
    route: AppRoutes.NewCheck,
    urlPattern: newCheckApiRegex,
    createContextItems: () => [
      structured('Create a new API endpoint check', {
        name: 'New API endpoint check',
        pageType: 'sm-new-check-api',
        capabilities: ['http-check-configuration', 'dns-check', 'tcp-check', 'grpc-check', 'response-validation', 'probe-selection'],
        help: 'User is creating a new API endpoint check (HTTP, DNS, TCP, or gRPC). Help with: configuring target URL/host, request method, headers and body for HTTP, response validation (status code, body content, regex, headers), SSL/TLS settings, timeout and frequency, and probe selection.',
      }),
    ],
    createQuestions: () => [
      question(
        'Configure my first HTTP check',
        'Walk me through configuring an HTTP check end-to-end: target URL, method, response validation, timeout, and frequency.'
      ),
      question(
        'Validate the response',
        'How do I assert specific content, status codes, headers, or regex matches in an HTTP response?'
      ),
      question(
        'DNS / TCP / gRPC checks',
        'Explain how API endpoint checks support DNS, TCP, and gRPC, and what fields differ for each.'
      ),
    ],
  },
  {
    id: 'sm-new-check-multistep',
    route: AppRoutes.NewCheck,
    urlPattern: newCheckMultiStepRegex,
    createContextItems: () => [
      structured('Create a new multi-step check', {
        name: 'New multi-step check',
        pageType: 'sm-new-check-multistep',
        capabilities: ['multistep-flow', 'request-chaining', 'response-extraction', 'probe-selection'],
        help: 'User is creating a multi-step HTTP check that runs multiple sequential requests with state passed between them. Help with: designing the request sequence, extracting values (tokens, ids) from one response and reusing them in subsequent requests, assertions per step, and choosing the right granularity for steps.',
      }),
    ],
    createQuestions: () => [
      question(
        'Build a multi-step flow',
        'Help me design a multi-step HTTP check that simulates a login + fetch flow with state shared between requests.'
      ),
      question(
        'Pass values between steps',
        "How do I extract a value (e.g. an auth token) from one step's response and use it in the next?"
      ),
    ],
  },
  {
    id: 'sm-new-check-scripted',
    route: AppRoutes.NewCheck,
    urlPattern: newCheckScriptedRegex,
    createContextItems: () => [
      structured('Create a new k6 scripted check', {
        name: 'New k6 scripted check',
        pageType: 'sm-new-check-scripted',
        capabilities: ['k6-scripting', 'k6-checks', 'k6-metrics', 'secrets-reference', 'probe-selection'],
        help: `User is creating a k6 scripted check (JavaScript) for synthetic monitoring. This is NOT a load test — the script runs as a single-VU probe check on a recurring schedule. Help with: writing the script (default export, http requests, sleep used sparingly), using the k6-testing assertions library (expect() from ${DOC_URLS.k6Assertions}) to fail-fast on assertion violations, referencing credentials via the SM Secrets module, and adapting existing perf-testing-shaped k6 scripts (stages/VUs/thresholds, classic check() calls) into the SM single-VU model. Prefer expect() over the classic check() function.`,
      }),
      smK6Conventions(),
    ],
    createQuestions: () => [
      question(
        'Help me write a k6 script',
        `Help me write a Grafana Synthetic Monitoring k6 scripted check. Ask me about the target, expected response, and failure criteria, then draft the script using the k6-testing assertions library (expect() from ${DOC_URLS.k6Assertions}) so the iteration fails fast on assertion violations.`
      ),
      question(
        'Common k6 patterns for SM',
        `Show me common patterns for k6 scripted synthetic monitoring checks: expect() assertions from the k6-testing library (${DOC_URLS.k6Assertions}), custom Trend/Counter metrics for observability, error handling, and reading secrets via the SM Secrets module. Do not suggest load-test constructs or the classic check() function.`
      ),
      question(
        'Adapt an existing k6 script',
        "I have an existing k6 script — ask me to paste it, then walk me through transforming it into a Grafana Synthetic Monitoring scripted check (remove stages/VUs/thresholds, swap env-var credentials for SM Secrets, ensure execution fits the check timeout)."
      ),
      question(
        'Reference a secret from my script',
        'How do I securely reference a secret (API key, password) from within a k6 scripted check using the Synthetic Monitoring Secrets module?'
      ),
    ],
  },
  {
    id: 'sm-new-check-browser',
    route: AppRoutes.NewCheck,
    urlPattern: newCheckBrowserRegex,
    createContextItems: () => [
      structured('Create a new k6 browser check', {
        name: 'New k6 browser check',
        pageType: 'sm-new-check-browser',
        capabilities: ['k6-browser', 'browser-automation', 'page-assertions', 'multi-page-flows', 'probe-selection'],
        help: `User is creating a k6 browser check (real headless browser) for synthetic monitoring. This is NOT a load test — the script runs as a single-VU probe check on a recurring schedule. Help with: writing browser scripts using the k6 browser API (page.goto, locator, waitForSelector), asserting on page content and DOM state with the k6-testing assertions library's auto-retrying matchers (await expect(page.locator(...)).toBeVisible(), .toHaveText(...), etc. — see ${DOC_URLS.k6Assertions}), navigating multi-page flows, referencing credentials via SM Secrets, and avoiding load-test constructs (no stages/VUs/thresholds). Prefer expect() over the classic check() function. Do NOT suggest page.screenshot() — screenshot capture is not currently functional in SM.`,
      }),
      smK6Conventions(),
    ],
    createQuestions: () => [
      question(
        'Help me write a browser script',
        `Help me write a Grafana Synthetic Monitoring k6 browser script. Ask me which user flow I want to monitor (target URL, steps, what to assert on), then draft the script using the k6 browser API together with the k6-testing assertions library's auto-retrying matchers (await expect(locator).toBeVisible() etc. — ${DOC_URLS.k6Assertions}).`
      ),
      question(
        'When do I need a browser check?',
        'What monitoring goals require a k6 browser check rather than a scripted one, and what are the cost and performance trade-offs?'
      ),
      question(
        'Common browser patterns for SM',
        `Show me common patterns for k6 browser checks in synthetic monitoring: waiting for elements with the k6-testing library's auto-retrying matchers (await expect(locator).toBeVisible() etc. — ${DOC_URLS.k6Assertions}), navigating multi-page flows, and referencing secrets via the SM Secrets module. Do not suggest load-test constructs, the classic check() function, or page.screenshot() (screenshot capture is not currently functional in SM).`
      ),
    ],
  },
  {
    id: 'sm-check-dashboard',
    route: AppRoutes.CheckDashboard,
    urlPattern: checkIdRegex,
    createContextItems: () => [
      structured('Check dashboard', {
        name: 'Check dashboard',
        pageType: 'sm-check-dashboard',
        capabilities: ['explain-failures', 'explain-metrics', 'explain-logs', 'debug-check'],
        help: 'Dashboard for a single synthetic monitoring check showing current status, recent results, latency, uptime, error breakdown by probe, and logs. Help with: diagnosing failures, interpreting latency and uptime metrics, identifying which probes are failing, and improving check reliability.',
      }),
    ],
    createQuestions: () => [
      question(
        'Diagnose a failing check',
        'This check is showing failures — walk me through diagnosing it: probe-level breakdown, error logs, latency anomalies, and external causes.'
      ),
      question(
        'Explain the metrics',
        'What do the uptime, reachability, latency, and SSL expiry metrics on this dashboard mean and how are they calculated?'
      ),
    ],
  },
  {
    id: 'sm-edit-check',
    route: AppRoutes.EditCheck,
    urlPattern: editCheckRegex,
    createContextItems: () => [
      structured('Edit a check', {
        name: 'Edit check',
        pageType: 'sm-edit-check',
        capabilities: ['check-configuration', 'probe-selection', 'k6-scripting', 'alerting-setup'],
        help: 'User is editing an existing synthetic monitoring check. Help with: adjusting target/URL, request method/headers/body, response validation, probe selection, frequency/timeout, k6 script edits for scripted/browser checks, and per-check alert configuration. If the check being edited is a k6 scripted or browser check, follow the SM k6 conventions in the hidden context — do not introduce load-test constructs.',
      }),
      smK6Conventions(),
    ],
    createQuestions: () => [
      question(
        'Tune frequency and timeout',
        "What are the right frequency and timeout settings, and how do they interact with my plan's execution budget?"
      ),
      question('Pick probes', 'How do I decide which probes to run this check from? How many is too many?'),
      question(
        'Configure alerts during edit',
        'How do I configure per-check alert sensitivity and thresholds while editing?'
      ),
    ],
  },
  {
    id: 'sm-probes-list',
    route: AppRoutes.Probes,
    urlPattern: `${root}/probes`,
    createContextItems: () => [
      structured('Probes list', {
        name: 'Probes list',
        pageType: 'sm-probes-list',
        capabilities: ['explain-probes', 'probe-regions', 'public-vs-private-probes'],
        help: 'Lists all probes available to the user (both Grafana-hosted public probes and any private probes the user has added). Help with: probe regions, the difference between public and private probes, and which probes to pick for a check.',
      }),
    ],
    createQuestions: () => [
      question(
        'Set up a private probe',
        `Walk me through setting up a Grafana Synthetic Monitoring private probe end-to-end, including auth, deployment, and verification. Reference ${DOC_URLS.privateProbes} for the full step-by-step guide.`
      ),
      question(
        'Public vs private probes',
        'When should I use Grafana-hosted public probes versus running my own private probes?'
      ),
      question(
        'Pick probes for a check',
        "What's the recommended probe selection strategy for a service used by global users vs a single region?"
      ),
    ],
  },
  {
    id: 'sm-new-probe',
    route: AppRoutes.NewProbe,
    urlPattern: `${root}/probes/new`,
    createContextItems: () => [
      structured('Create a new probe', {
        name: 'New probe',
        pageType: 'sm-new-probe',
        capabilities: ['probe-setup', 'private-probe-deployment'],
        help: 'User is creating a new private probe. Help with: naming the probe, setting its region and coordinates, generating an authentication token, deploying the probe agent (container/binary), and verifying connectivity back to Grafana Cloud.',
      }),
    ],
    createQuestions: () => [
      question(
        'Deploy a private probe to Kubernetes',
        `Help me deploy a private probe to a Kubernetes cluster using the Helm chart or manifest. The full setup guide is at ${DOC_URLS.privateProbes}.`
      ),
      question(
        'Deploy a private probe via Docker',
        `Show me how to run a private probe as a Docker container, with the right config and secret handling. Refer to ${DOC_URLS.privateProbes} for the full setup.`
      ),
      question(
        'Probe deployment troubleshooting',
        'What are the common reasons a newly deployed private probe fails to connect, and how do I troubleshoot each?'
      ),
    ],
  },
  {
    id: 'sm-view-probe',
    route: AppRoutes.ViewProbe,
    urlPattern: probeIdRegex,
    createContextItems: () => [
      structured('View probe', {
        name: 'View probe',
        pageType: 'sm-view-probe',
        capabilities: ['probe-status', 'probe-debug', 'probe-version'],
        help: 'Viewing details of a single probe: region, version, connection status, and the checks assigned to it. Help with: probe health, version updates, and diagnosing why a probe might be disconnected.',
      }),
    ],
    createQuestions: () => [
      question(
        'Why is this probe disconnected?',
        'Walk me through diagnosing why a private probe is disconnected: network, auth, version, resource limits.'
      ),
      question(
        'Update probe version',
        'How do I update this probe to the latest agent version safely without dropping checks?'
      ),
    ],
  },
  {
    id: 'sm-edit-probe',
    route: AppRoutes.EditProbe,
    urlPattern: editProbeRegex,
    createContextItems: () => [
      structured('Edit probe', {
        name: 'Edit probe',
        pageType: 'sm-edit-probe',
        capabilities: ['probe-setup', 'private-probe-config'],
        help: 'User is editing a private probe. Help with: renaming, changing region/coordinates, rotating authentication tokens, and managing labels.',
      }),
    ],
    createQuestions: () => [
      question(
        'Rotate the auth token',
        "Walk me through rotating this probe's authentication token without downtime."
      ),
      question(
        'Probe labelling strategy',
        "What's a good labelling strategy for private probes across multiple regions and teams?"
      ),
    ],
  },
  {
    id: 'sm-alerts',
    route: AppRoutes.Alerts,
    urlPattern: `${root}/alerts`,
    createContextItems: () => [
      structured('Synthetic Monitoring alerts (legacy)', {
        name: 'Alerts (legacy)',
        pageType: 'sm-alerts',
        capabilities: ['explain-alerts', 'alerting-migration', 'alerting-best-practices'],
        help: 'The legacy alerts page for Synthetic Monitoring. Help with: understanding the legacy alerting model, migrating to per-check alerts, and writing alert rules for SM metrics.',
      }),
    ],
    createQuestions: () => [
      question(
        'Migrate to per-check alerts',
        `Explain the newer per-check alerts model in Grafana Synthetic Monitoring and walk me through migrating from this legacy alerts page. Reference ${DOC_URLS.perCheckAlerts} for full details.`
      ),
      question(
        'Best practices for SM alerts',
        'What are best practices for alerting on synthetic monitoring metrics? Which metrics matter most?'
      ),
    ],
  },
  {
    id: 'sm-config',
    route: AppRoutes.Config,
    urlPattern: new RegExp(`^${escapedRoot}/config(/.*)?$`),
    createContextItems: () => [
      structured('Synthetic Monitoring configuration', {
        name: 'Configuration',
        pageType: 'sm-config',
        capabilities: ['app-setup', 'datasource-setup', 'access-tokens', 'terraform-export', 'secrets-management'],
        help: 'Configuration area for the Synthetic Monitoring app, with tabs for General settings (datasources, API host), Access Tokens (for SM API and Terraform), Terraform export (download existing checks/probes as IaC), and Secrets management (referenced by scripted/browser checks at runtime). Help with: app provisioning, API token rotation, exporting checks to Terraform, and managing secrets safely.',
      }),
    ],
    createQuestions: () => [
      question(
        'Export as Terraform',
        'Walk me through exporting my existing checks and probes as Terraform configuration.'
      ),
      question(
        'Manage API tokens',
        "How do I create and rotate Synthetic Monitoring API tokens? What's each token type used for?"
      ),
      question(
        'Use a secret in a scripted check',
        'How do I create a secret here and reference it from a k6 scripted or browser check at runtime?'
      ),
    ],
  },
];
