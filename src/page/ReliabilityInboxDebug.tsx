// TEMPORARY — debug harness for the reliability-inbox experiment. Delete along
// with this file's usage in SceneHomepage.tsx; nothing else imports it.
//
// It exists because the compiled datasource method cannot be exercised from the
// browser console: Grafana 13.2 exposes no datasource service on
// `window.grafanaRuntime`, so there is no way to obtain a real SMDataSource
// instance outside React. Inside the app, `useSMDS()` provides one.
import React, { useState } from 'react';
import { Button, Stack } from '@grafana/ui';

import { ReliabilityInboxResult } from 'datasource/responses.types';
import { useSMDS } from 'hooks/useSMDS';

export function ReliabilityInboxDebug() {
  const smDS = useSMDS();
  const [state, setState] = useState<'idle' | 'loading'>('idle');
  const [output, setOutput] = useState<string>('');
  const [elapsed, setElapsed] = useState<number | undefined>();

  const supported = smDS.supportsReliabilityInbox();

  const run = async () => {
    setState('loading');
    setOutput('');
    setElapsed(undefined);

    const startedAt = performance.now();

    try {
      const result: ReliabilityInboxResult = await smDS.getReliabilityInboxSuggestions();
      setOutput(JSON.stringify(result, null, 2));
    } catch (e) {
      setOutput(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setElapsed((performance.now() - startedAt) / 1000);
      setState('idle');
    }
  };

  return (
    <div style={{ border: '2px dashed orange', padding: 12, marginBottom: 16 }}>
      <Stack direction="column" gap={1}>
        <strong>reliability-inbox (temporary debug panel)</strong>

        {!supported && (
          <span>
            No instance serves this stack&apos;s region (apiHost: {String(smDS.instanceSettings.jsonData.apiHost)}).
          </span>
        )}

        <Stack direction="row" gap={1} alignItems="center">
          <Button onClick={run} disabled={!supported || state === 'loading'}>
            {state === 'loading' ? 'Running… (can take ~30s)' : 'Get suggestions'}
          </Button>
          {elapsed !== undefined && <span>{elapsed.toFixed(1)}s</span>}
        </Stack>

        {output && (
          <pre style={{ maxHeight: 400, overflow: 'auto', fontSize: 11, whiteSpace: 'pre-wrap' }}>{output}</pre>
        )}
      </Stack>
    </div>
  );
}
