import { useMemo, useRef, useState } from 'react';
import { suggestSecretName, useMonacoSecretScanner } from '@grafana/plugin-ui/secret-scanner';
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';

import { FeatureName } from 'types';
import { getUserPermissions } from 'data/permissions';
import { useSecrets } from 'data/useSecrets';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { SecretFormValues } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

interface UseScriptSecretScannerParams {
  field: string;
  script: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

// Secret scanner: detection + Monaco markers/quick fix live in the
// @grafana/plugin-ui package; we own the availability gating and — via our own
// SecretEditModal — the create call and migration UI.
export function useScriptSecretScanner({ field, script, onChange, disabled }: UseScriptSecretScannerParams) {
  const [monaco, setMonaco] = useState<typeof monacoType>();
  const [editor, setEditor] = useState<monacoType.editor.IStandaloneCodeEditor>();

  const { isEnabled: secretsEnabled } = useFeatureFlag(FeatureName.SecretsManagement);
  const { canCreateSecrets, canReadSecrets } = getUserPermissions();
  const { data: secrets = [] } = useSecrets(secretsEnabled && canReadSecrets);
  const existingSecretNames = useMemo(() => secrets.map((secret) => secret.name), [secrets]);

  const scanner = useMonacoSecretScanner({
    monaco,
    editor,
    text: script,
    onChange,
    enabled: secretsEnabled,
    canMigrate: secretsEnabled && canCreateSecrets && !disabled,
    ignoreStorageKey: `sm.secretScanner.ignored.${field}`,
  });

  // When the user picks a finding to migrate (panel button or Monaco quick fix),
  // the hook exposes it as `migration.finding`; the caller renders its own
  // SecretEditModal prefilled from it.
  //
  // Snapshot existing names at request time so a later secrets-list update
  // cannot rebuild this object and reset the open modal.
  const { finding: activeFinding } = scanner.migration;
  const namesWhenRequested = useRef(existingSecretNames);
  namesWhenRequested.current = existingSecretNames;
  const secretInitialValues = useMemo<Partial<SecretFormValues & { plaintext?: string }> | undefined>(
    () =>
      activeFinding
        ? {
            name: suggestSecretName(activeFinding, namesWhenRequested.current),
            description: `Migrated from script (${activeFinding.label})`,
            plaintext: activeFinding.secret,
            labels: [{ name: 'auto-secret', value: activeFinding.type }],
          }
        : undefined,
    [activeFinding]
  );

  return {
    scanner,
    secretsEnabled,
    existingSecretNames,
    activeFinding,
    secretInitialValues,
    onEditorMount: (nextEditor: monacoType.editor.IStandaloneCodeEditor, nextMonaco: typeof monacoType) => {
      setEditor(nextEditor);
      setMonaco(nextMonaco);
    },
  };
}
