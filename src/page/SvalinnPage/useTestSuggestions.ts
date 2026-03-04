import { useEffect, useRef, useState } from 'react';
import { useInlineAssistant } from '@grafana/assistant';

import { MOCK_TEST_ENTRIES } from './svalinn.mock';

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

export function useTestSuggestions(): UseTestSuggestionsReturn {
  const assistantResult = useInlineAssistant();
  const assistantRef = useRef(assistantResult);
  assistantRef.current = assistantResult;

  const [suggestions, setSuggestions] = useState<TestSuggestion[]>(() => loadSuggestions());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGenerated = useRef(false);

  useEffect(() => {
    const stored = loadSuggestions();
    if (assistantRef.current == null || hasGenerated.current || stored.length >= 5) {
      return;
    }

    hasGenerated.current = true;
    setIsGenerating(true);
    setError(null);

    const dismissed = loadDismissed();
    const testNames = MOCK_TEST_ENTRIES.map((e) => e.name);

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

    let coverageSummary = '';

    void assistantRef.current.generate({
      prompt: contextUserPrompt,
      systemPrompt: contextSystemPrompt,
      origin: 'grafana-irm-app/suggested-tests-context',
      onDelta: (delta: string) => {
        coverageSummary += delta;
      },
      onError: (err: Error) => {
        console.error('Assistant context error:', err);
        setError(err?.message || 'Failed to generate suggestions');
        setIsGenerating(false);
      },
      onComplete: () => {
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

        const suggestionsUserPrompt = `Look for patterns in our most recent 10 incidents and suggest up to ${needed} additional tests that would prevent similar issues. It is fine to return an empty array if no further tests are warranted. Return ONLY a JSON array.`;

        let accumulated = '';

        void assistantRef.current!.generate({
          prompt: suggestionsUserPrompt,
          systemPrompt: suggestionsSystemPrompt,
          origin: 'grafana-irm-app/suggested-tests',
          onDelta: (delta: string) => {
            accumulated += delta;
          },
          onError: (err: Error) => {
            console.error('Assistant error:', err);
            setError(err?.message || 'Failed to generate suggestions');
            setIsGenerating(false);
          },
          onComplete: () => {
            try {
              const match = accumulated.match(/\[[\s\S]*\]/);
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
  }, []);

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
