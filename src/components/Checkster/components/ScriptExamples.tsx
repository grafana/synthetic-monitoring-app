import React, { useMemo } from 'react';

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
        groups: examples.map(({ label, script }) => ({
          value: label,
          label,
          code: script,
          lang: 'js',
        })),
      },
    ];
  }, [examples]);

  return <CodeSnippet hideHeader canCopy dedent tabs={tabs} lang="js" />;
}
