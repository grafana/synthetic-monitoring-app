import React from 'react';
import { providePageContext, provideQuestions, useAssistant } from '@grafana/assistant';
import { render } from '@testing-library/react';

import { AppRoutes } from 'routing/types';

import { AssistantContext } from './AssistantContext';
import { ASSISTANT_CONTEXT_EXCLUDED_ROUTES, ASSISTANT_PAGE_CONTEXTS } from './AssistantContext.constants';

const mockedProvidePageContext = jest.mocked(providePageContext);
const mockedProvideQuestions = jest.mocked(provideQuestions);
const mockedUseAssistant = jest.mocked(useAssistant);

const ENTRIES_WITH_QUESTIONS = ASSISTANT_PAGE_CONTEXTS.filter((entry) => entry.createQuestions);

function setAssistantState(overrides: Partial<ReturnType<typeof useAssistant>> = {}) {
  mockedUseAssistant.mockReturnValue({
    isAvailable: true,
    isLoading: false,
    openAssistant: jest.fn(),
    closeAssistant: jest.fn(),
    toggleAssistant: jest.fn(),
    ...overrides,
  });
}

describe('AssistantContext', () => {
  beforeEach(() => {
    setAssistantState();
  });

  describe('constants coverage', () => {
    it('covers every AppRoutes value except the explicitly excluded ones', () => {
      const coveredRoutes = new Set(ASSISTANT_PAGE_CONTEXTS.map((entry) => entry.route));
      const allRoutes = Object.values(AppRoutes);

      const missing = allRoutes.filter(
        (route) => !coveredRoutes.has(route) && !ASSISTANT_CONTEXT_EXCLUDED_ROUTES.has(route)
      );

      expect(missing).toEqual([]);
    });

    it('does not have duplicate ids', () => {
      const ids = ASSISTANT_PAGE_CONTEXTS.map((entry) => entry.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('produces at least one context item per entry', () => {
      ASSISTANT_PAGE_CONTEXTS.forEach((entry) => {
        expect(entry.createContextItems().length).toBeGreaterThan(0);
      });
    });

    it('produces at least one starter question per entry that opts in', () => {
      ENTRIES_WITH_QUESTIONS.forEach((entry) => {
        const questions = entry.createQuestions!();
        expect(questions.length).toBeGreaterThan(0);
        questions.forEach((q) => {
          expect(q.prompt.trim()).not.toBe('');
        });
      });
    });

    it('splits the new-check page into one entry per CheckTypeGroup', () => {
      const newCheckEntries = ASSISTANT_PAGE_CONTEXTS.filter((entry) => entry.route === AppRoutes.NewCheck);
      const ids = newCheckEntries.map((entry) => entry.id).sort();
      expect(ids).toEqual([
        'sm-new-check-api',
        'sm-new-check-browser',
        'sm-new-check-multistep',
        'sm-new-check-scripted',
      ]);
    });

    it('attaches the hidden SM k6 conventions context to all k6 authoring entries', () => {
      const k6Authoring = new Set(['sm-new-check-scripted', 'sm-new-check-browser', 'sm-edit-check']);

      ASSISTANT_PAGE_CONTEXTS.forEach((entry) => {
        const items = entry.createContextItems();
        const hasK6Conventions = items.some(
          // The mock returns the params object verbatim, so `data.pageType` is reachable directly.
          (item: unknown) => (item as { data?: { pageType?: string } }).data?.pageType === 'sm-k6-conventions'
        );

        if (k6Authoring.has(entry.id)) {
          expect(hasK6Conventions).toBe(true);
        } else {
          expect(hasK6Conventions).toBe(false);
        }
      });
    });

    it('directs the k6 conventions toward the k6-testing assertions library (not classic check())', () => {
      const items = ASSISTANT_PAGE_CONTEXTS.find((entry) => entry.id === 'sm-new-check-scripted')!.createContextItems();
      const conventionsItem = items.find(
        (item: unknown) => (item as { data?: { pageType?: string } }).data?.pageType === 'sm-k6-conventions'
      ) as unknown as { data: { rules: string[]; warning: string } } | undefined;

      expect(conventionsItem).toBeDefined();
      const allText = [...conventionsItem!.data.rules, conventionsItem!.data.warning].join('\n');

      // Recommends expect() from the k6-testing library and links the docs.
      expect(allText).toMatch(/k6-testing/i);
      expect(allText).toMatch(/expect\(\)/);
      expect(allText).toMatch(/grafana\.com\/docs\/k6\/.+assertions/);

      // Explicitly warns off classic check() for SM.
      expect(allText.toLowerCase()).toContain('avoid the classic k6 `check()` function');

      // Explicitly warns off screenshots — they are not currently functional in SM.
      expect(allText.toLowerCase()).toContain('do not suggest capturing screenshots');
    });

    it('does not recommend screenshot capture anywhere in the visible context or prompts', () => {
      // Surface any "screenshot" mentions and assert they are in DO-NOT framing.
      // This guards against regressions where someone re-introduces "capturing screenshots on failure"
      // before SM's screenshot feature ships.
      const allVisibleStrings: string[] = [];

      ASSISTANT_PAGE_CONTEXTS.forEach((entry) => {
        entry.createContextItems().forEach((item) => {
          const itemData = (item as unknown as { data?: Record<string, unknown>; hidden?: boolean }).data ?? {};
          if (typeof itemData.help === 'string') {
            allVisibleStrings.push(itemData.help);
          }
          if (Array.isArray(itemData.capabilities)) {
            allVisibleStrings.push(...itemData.capabilities.filter((cap): cap is string => typeof cap === 'string'));
          }
        });

        entry.createQuestions?.().forEach((q) => {
          allVisibleStrings.push(q.prompt);
          if (q.title) {
            allVisibleStrings.push(q.title);
          }
        });
      });

      allVisibleStrings.forEach((text) => {
        const lower = text.toLowerCase();
        if (lower.includes('screenshot')) {
          // Must appear in DO-NOT framing only.
          expect(lower).toMatch(/do not|don't|not currently functional|not yet available/);
        }
      });
    });

    it('does not include unresolved placeholder tokens in starter prompts', () => {
      ENTRIES_WITH_QUESTIONS.forEach((entry) => {
        entry.createQuestions!().forEach((q) => {
          expect(q.prompt).not.toMatch(/\[(describe|your|the)\b[^\]]*\]/i);
        });
      });
    });
  });

  describe('when the Assistant is available', () => {
    it('registers every entry as page context', () => {
      render(<AssistantContext />);

      expect(mockedProvidePageContext).toHaveBeenCalledTimes(ASSISTANT_PAGE_CONTEXTS.length);

      ASSISTANT_PAGE_CONTEXTS.forEach((entry) => {
        expect(mockedProvidePageContext).toHaveBeenCalledWith(entry.urlPattern, expect.any(Array));
      });
    });

    it('registers starter questions for every entry that opts in', () => {
      render(<AssistantContext />);

      expect(mockedProvideQuestions).toHaveBeenCalledTimes(ENTRIES_WITH_QUESTIONS.length);

      ENTRIES_WITH_QUESTIONS.forEach((entry) => {
        expect(mockedProvideQuestions).toHaveBeenCalledWith(entry.urlPattern, expect.any(Array));
      });
    });

    it('unregisters every context and question registration on unmount', () => {
      const { unmount } = render(<AssistantContext />);
      const contextUnregisters = mockedProvidePageContext.mock.results.map((result) => result.value.unregister);
      const questionUnregisters = mockedProvideQuestions.mock.results.map((result) => result.value.unregister);

      expect(contextUnregisters).toHaveLength(ASSISTANT_PAGE_CONTEXTS.length);
      expect(questionUnregisters).toHaveLength(ENTRIES_WITH_QUESTIONS.length);

      unmount();

      contextUnregisters.forEach((unregister) => {
        expect(unregister).toHaveBeenCalledTimes(1);
      });
      questionUnregisters.forEach((unregister) => {
        expect(unregister).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('when the Assistant is unavailable', () => {
    it('does not register anything', () => {
      setAssistantState({
        isAvailable: false,
        openAssistant: undefined,
        closeAssistant: undefined,
        toggleAssistant: undefined,
      });

      render(<AssistantContext />);

      expect(mockedProvidePageContext).not.toHaveBeenCalled();
      expect(mockedProvideQuestions).not.toHaveBeenCalled();
    });
  });

  describe('while the Assistant availability is loading', () => {
    it('does not register anything until loading completes', () => {
      setAssistantState({ isAvailable: false, isLoading: true });

      render(<AssistantContext />);

      expect(mockedProvidePageContext).not.toHaveBeenCalled();
      expect(mockedProvideQuestions).not.toHaveBeenCalled();
    });
  });
});
