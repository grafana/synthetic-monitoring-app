import React from 'react';
import {
  isAssistantAvailable,
  createAssistantContextItem,
  providePageContext,
} from '@grafana/assistant';

import type { InsightsResponse } from 'datasource/responses.types';

import { PAGE_CONTEXT_TITLE, PAGE_CONTEXT_DESCRIPTION, PAGE_CONTEXT_INSTRUCTIONS } from './InsightsPage.prompts';

export function useIsAssistantAvailable() {
  const [available, setAvailable] = React.useState(false);

  React.useEffect(() => {
    const sub = isAssistantAvailable().subscribe({
      next: (val) => setAvailable(val),
      error: () => setAvailable(false),
    });
    return () => sub.unsubscribe();
  }, []);

  return available;
}

export function useInsightsAssistantContext(data: InsightsResponse | undefined) {
  const available = useIsAssistantAvailable();

  React.useEffect(() => {
    if (!data || !available) {
      return;
    }

    try {
      const ctx = createAssistantContextItem('structured', {
        title: PAGE_CONTEXT_TITLE,
        data: {
          type: 'sm-insights',
          description: PAGE_CONTEXT_DESCRIPTION,
          ...data,
        },
      });

      const instructions = createAssistantContextItem('structured', {
        title: 'SM Analysis Instructions',
        data: { instructions: PAGE_CONTEXT_INSTRUCTIONS },
        hidden: true,
      });

      const reg = providePageContext(/\/home/, [ctx, instructions]);
      return () => reg.unregister();
    } catch {
      // Assistant context registration not available
    }
    return undefined;
  }, [data, available]);
}

export function useCheckInvestigation() {
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);

  const toggle = (checkId: number, issueType: string) => {
    const key = `${issueType}-${checkId}`;
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const isExpanded = (checkId: number, issueType: string) => expandedKey === `${issueType}-${checkId}`;

  return { isExpanded, toggle };
}
