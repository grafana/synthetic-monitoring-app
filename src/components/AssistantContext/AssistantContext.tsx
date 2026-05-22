import { useEffect } from 'react';
import { providePageContext, provideQuestions, useAssistant } from '@grafana/assistant';

import { ASSISTANT_PAGE_CONTEXTS } from './AssistantContext.constants';

/**
 * Registers static page context and starter questions with the Grafana
 * Assistant SDK so that the Assistant knows which Synthetic Monitoring
 * page the user is currently on and can suggest relevant first prompts.
 *
 * This is Phase 1 of the Assistant integration: a fixed set of `structured`
 * context items and questions keyed by URL pattern. No dynamic state is
 * exposed yet (e.g. the current check id is not included). See
 * `.cursor/references/grafana-assistant-phase-2.md` for the follow-up plan.
 *
 * Renders nothing. Safe to mount once at the root of the application.
 */
export function AssistantContext() {
  const { isAvailable, isLoading } = useAssistant();

  useEffect(() => {
    if (isLoading || !isAvailable) {
      return;
    }

    try {
      const contextRegistrations = ASSISTANT_PAGE_CONTEXTS.map((entry) =>
        providePageContext(entry.urlPattern, entry.createContextItems())
      );

      const questionRegistrations = ASSISTANT_PAGE_CONTEXTS.filter((entry) => entry.createQuestions).map((entry) =>
        provideQuestions(entry.urlPattern, entry.createQuestions!())
      );

      return () => {
        contextRegistrations.forEach((registration) => registration.unregister());
        questionRegistrations.forEach((registration) => registration.unregister());
      };
    } catch {
      // Assistant SDK not fully available — registrations are best-effort.
    }

    return undefined;
  }, [isAvailable, isLoading]);

  return null;
}
