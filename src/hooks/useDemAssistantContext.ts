import { useEffect, useMemo } from 'react';
import { createAssistantContextItem, useProvidePageContext } from '@grafana/assistant';

import { Check, CheckType } from 'types';
import { getCheckType } from 'utils';
import { PLUGIN_URL_PATH } from 'routing/constants';

// Onboarding entry point for Grafana Frontend Observability ("create web app" page).
const FRONTEND_OBSERVABILITY_SETUP_URL = '/a/grafana-kowalski-app/apps/new';

// The context is registered for any Synthetic Monitoring app page where this hook is
// mounted (today: the home, check-list, and browser check dashboard pages).
const URL_PATTERN = `${PLUGIN_URL_PATH}**`;

interface DemAssistantContextOptions {
  // The browser check the user is currently viewing, when on a single-check page.
  focusedCheck?: Check;
}

/**
 * Provides the Grafana Assistant with product context describing how Synthetic Monitoring
 * browser checks (synthetic monitoring) relate to Grafana Frontend Observability (real-user
 * monitoring). This grounds the Assistant so that questions about the real-user side of a
 * browser check get an accurate, useful answer, and includes the user's browser checks so the
 * Assistant can reference them and recommend instrumenting the same URLs.
 *
 * The context is only registered when the user has at least one browser check, and stays
 * dormant unless the conversation is about real-user impact.
 */
export function useDemAssistantContext(checks: Check[], options: DemAssistantContextOptions = {}) {
  const { focusedCheck } = options;

  const browserChecks = useMemo(
    () => checks.filter((check) => getCheckType(check.settings) === CheckType.Browser),
    [checks]
  );

  const focusedBrowserCheck =
    focusedCheck && getCheckType(focusedCheck.settings) === CheckType.Browser ? focusedCheck : undefined;

  const context = useMemo(() => {
    if (browserChecks.length === 0) {
      return [];
    }

    return [
      createAssistantContextItem('structured', {
        title: 'Synthetic Monitoring browser checks & Frontend Observability',
        bypassLimits: true,
        data: {
          userActivity: 'The user is working with Synthetic Monitoring browser checks in Grafana Cloud.',
          whatBrowserChecksAre:
            'Browser checks are scripted, synthetic checks run on a schedule from Grafana probes. They ' +
            'simulate a user journey through a web app to proactively detect when a critical flow breaks, ' +
            'errors, or slows down — independently of real traffic.',
          realUserCounterpart: {
            product: 'Grafana Frontend Observability',
            whatItIs:
              'Real-user monitoring (RUM) for web applications. Captures how actual users experience the ' +
              'app: Core Web Vitals, page-load and interaction performance, JavaScript errors, and the ' +
              'geographies, browsers, and sessions involved.',
            howItRelatesToBrowserChecks:
              'Synthetic browser checks are the detection layer — they tell you something broke from a ' +
              'simulated path. Frontend Observability adds the real-user layer — who was actually affected, ' +
              'where, on what device, and what they experienced. Run together they cover both the simulated ' +
              'and the real-user view of the same journeys, so a synthetic failure can be tied to its ' +
              'real-world user impact.',
            questionsItAnswers: [
              'How many real users were affected by what a check just caught, and in which geos?',
              'Is a failing check a real user-facing incident, or a low-impact blip?',
              'Which pages and journeys get the most real traffic, so checks can focus there?',
              'What did real users actually experience (errors, slow loads) around a failure?',
            ],
          },
          userBrowserChecks: browserChecks.map((check) => ({ job: check.job, target: check.target })),
          ...(focusedBrowserCheck
            ? { currentlyViewedCheck: { job: focusedBrowserCheck.job, target: focusedBrowserCheck.target } }
            : {}),
          setup: {
            // Canonical entry point for creating a Frontend Observability app. The in-product flow
            // generates the exact Faro configuration once the user lands here.
            entryPoint: FRONTEND_OBSERVABILITY_SETUP_URL,
            recommendation:
              'Recommend the user instrument the same URL their browser check monitors first — for a failed ' +
              'check, the target of that failed check — so the synthetic check and the real-user data cover ' +
              'the same journey.',
          },
          assistantGuidance:
            'Frontend Observability is the relevant product when the user asks about real-user impact, who ' +
            'was affected, or getting the real-user view of their browser checks — explain how it ' +
            'complements their synthetic checks, and offer to take them to set it up. When linking or ' +
            'navigating the user to set up, use the setup entry point URL provided in this context (the ' +
            'create-web-app page) and let the in-product flow generate the Faro configuration; do not ' +
            'substitute a different URL or improvise manual setup steps. Navigate only once the user ' +
            'chooses to set it up or get started.',
        },
      }),
    ];
  }, [browserChecks, focusedBrowserCheck]);

  const setPageContext = useProvidePageContext(URL_PATTERN, context);

  useEffect(() => {
    setPageContext(context);
  }, [setPageContext, context]);
}
