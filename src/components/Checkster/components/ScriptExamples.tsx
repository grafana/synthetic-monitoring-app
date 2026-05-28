import React, { useCallback, useMemo } from 'react';
import { trackExampleScriptCopied, trackExampleScriptSelected } from 'features/tracking/checkFormEvents';

import { CodeSnippetTab } from '../../CodeSnippet/CodeSnippet.types';

import { CodeSnippet } from '../../CodeSnippet';
import { ExampleScript } from '../../ScriptExamplesMenu/constants';

interface ScriptExamplesProps {
  examples: ExampleScript[];
}
export function ScriptExamples({ examples }: ScriptExamplesProps) {
  const tabs: CodeSnippetTab[] = useMemo(() => {
    return [
      {
        value: 'Example scripts',
        label: '',
        groups: examples.map(({ label, script, isNew }) => ({
          value: label,
          label,
          code: script,
          lang: 'js',
          isNew,
        })),
      },
    ];
  }, [examples]);

  const handleGroupChange = useCallback((script: string) => {
    trackExampleScriptSelected({ script });
  }, []);

  const handleCopy = useCallback((script: string) => {
    trackExampleScriptCopied({ script });
  }, []);

  return (
    <CodeSnippet hideHeader canCopy dedent tabs={tabs} lang="js" onGroupChange={handleGroupChange} onCopy={handleCopy} />
  );
}
