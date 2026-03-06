import { useEffect, useRef, useState } from 'react';
import { useInlineAssistant } from '@grafana/assistant';

import type { TestEntry } from './svalinn.types';

export interface TestSuggestion {
  severity: 'critical' | 'warning';
  incident: string;
  description: string;
  aiHint: string;
  category: 'performance' | 'availability' | 'fallback' | 'latency';
  actionLabel: string;
  incidentsCovered: number;
}

export interface UseTestSuggestionsReturn {
  isGenerating: boolean;
  suggestions: TestSuggestion[];
  error: string | null;
  dismiss: (suggestion: TestSuggestion) => void;
}

const STORAGE_KEY_SUGGESTIONS = 'svalinn.suggestions';
const STORAGE_KEY_DISMISSED = 'svalinn.dismissed';

function loadSuggestions(): TestSuggestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUGGESTIONS);
    return raw ? (JSON.parse(raw) as TestSuggestion[]) : [];
  } catch {
    return [];
  }
}

function loadDismissed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISMISSED);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveSuggestions(suggestions: TestSuggestion[]): void {
  localStorage.setItem(STORAGE_KEY_SUGGESTIONS, JSON.stringify(suggestions));
}

function saveDismissed(dismissed: string[]): void {
  localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(dismissed));
}

export function useTestSuggestions(testEntries: TestEntry[], isReady: boolean): UseTestSuggestionsReturn {
  const assistantResult = useInlineAssistant();
  const assistantRef = useRef(assistantResult);
  assistantRef.current = assistantResult;

  const testEntriesRef = useRef(testEntries);
  testEntriesRef.current = testEntries;

  const [suggestions, setSuggestions] = useState<TestSuggestion[]>(() => loadSuggestions());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGenerated = useRef(false);

  useEffect(() => {
    const stored = loadSuggestions();
    if (!isReady || assistantRef.current == null || hasGenerated.current || stored.length >= 5) {
      return;
    }

    hasGenerated.current = true;
    setIsGenerating(true);
    setError(null);

    const dismissed = loadDismissed();
    const testNames = testEntriesRef.current.map((e) => e.name);

    const contextSystemPrompt = `You are an expert at writing software and infrastructure tests. Summarize what test coverage already exists and what has been rejected, so we know what NOT to suggest next.`;

    const contextUserPrompt = [
      'Here is the current test coverage context:',
      '',
      stored.length > 0
        ? `Active suggestions:\n${stored.map((s) => `- ${s.description}`).join('\n')}`
        : 'No active suggestions.',
      '',
      dismissed.length > 0
        ? `Previously dismissed (do not re-suggest these):\n${dismissed.map((d) => `- ${d}`).join('\n')}`
        : 'Nothing has been dismissed.',
      '',
      testNames.length > 0
        ? `Existing tests already created:\n${testNames.map((n) => `- ${n}`).join('\n')}`
        : 'No existing tests.',
      '',
      'Produce a concise summary (2-4 sentences) of what coverage already exists and what areas to avoid suggesting.',
    ].join('\n');

    void assistantRef.current.generate({
      prompt: contextUserPrompt,
      systemPrompt: contextSystemPrompt,
      origin: 'grafana-irm-app/suggested-tests-context',
      onError: (err: Error) => {
        console.error('Assistant context error:', err);
        setError(err?.message || 'Failed to generate suggestions');
        setIsGenerating(false);
      },
      onComplete: (coverageSummary: string) => {
        const needed = 5 - stored.length;
        const suggestionsSystemPrompt = [
          'You are an expert at writing software and infrastructure tests.',
          'Return ONLY a JSON array with no preamble, markdown, or explanation.',
          'Each element must have these fields: severity ("critical" or "warning"), incident (short incident name),',
          'description (what the test checks), aiHint (why this test would have caught the incident),',
          'category ("performance", "availability", "fallback", or "latency"),',
          'actionLabel (short CTA label like "Create test"), incidentsCovered (integer).',
          '',
          `Coverage context (avoid duplicating or re-suggesting anything covered here):\n${coverageSummary}`,
        ].join('\n');

        const noExisting = stored.length === 0;
        const emptyArrayGuidance = noExisting
          ? 'Always suggest at least 1–2 tests even if patterns are subtle — an empty suggestion list is not helpful.'
          : 'It is fine to return an empty array if no further tests are warranted.';
        const suggestionsUserPrompt = `Look for patterns in our most recent 10 incidents and suggest up to ${needed} additional tests that would prevent similar issues. ${emptyArrayGuidance} Return ONLY a JSON array.`;

        void assistantRef.current!.generate({
          prompt: suggestionsUserPrompt,
          systemPrompt: suggestionsSystemPrompt,
          origin: 'grafana-irm-app/suggested-tests',
          onError: (err: Error) => {
            console.error('Assistant error:', err);
            setError(err?.message || 'Failed to generate suggestions');
            setIsGenerating(false);
          },
          onComplete: (text: string) => {
            try {
              const match = text.match(/\[[\s\S]*\]/);
              const newSuggestions: TestSuggestion[] = match ? JSON.parse(match[0]) : [];
              const existingDescriptions = new Set(stored.map((s) => s.description));
              const unique = newSuggestions.filter((s) => !existingDescriptions.has(s.description));
              const merged = [...stored, ...unique];
              setSuggestions(merged);
              saveSuggestions(merged);
            } catch {
              // keep existing stored suggestions on parse failure
            }
            setIsGenerating(false);
          },
        });
      },
    });
  }, [isReady]);

  const dismiss = (suggestion: TestSuggestion): void => {
    setSuggestions((prev) => {
      const next = prev.filter((s) => s.description !== suggestion.description);
      saveSuggestions(next);
      return next;
    });
    const dismissed = loadDismissed();
    if (!dismissed.includes(suggestion.description)) {
      saveDismissed([...dismissed, suggestion.description]);
    }
  };

  return {
    isGenerating,
    suggestions,
    error,
    dismiss,
  };
}
