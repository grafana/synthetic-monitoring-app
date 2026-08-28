import React, { useRef, useState } from 'react';
import { Button, Field, Input, Space, Stack, Text } from '@grafana/ui';

import { validateLabelName } from 'validation';
import { useRenameCheckLabels } from 'data/useRenameCheckLabels';

interface RowState {
  value: string;
  pending?: boolean;
  renamed?: boolean;
  updatedCount?: number;
  error?: string;
}

interface CollidingLabelRenameProps {
  labels: string[];
  systemLabels: string[];
  disabled: boolean;
  retrying: boolean;
  onRetry: () => void;
}

// CollidingLabelRename renders one rename row per colliding label and gates the
// transition retry on every label having been renamed. Renames only cover
// checks: a label that reports zero updated checks most likely lives on a
// probe, which must be edited directly.
export function CollidingLabelRename({ labels, systemLabels, disabled, retrying, onRetry }: CollidingLabelRenameProps) {
  const renameMutation = useRenameCheckLabels();
  const [rows, setRows] = useState<Record<string, RowState>>({});
  // Guards a same-row double click: isPending only disables the button after a
  // re-render, so a second click in the same tick would fire a second POST
  // whose empty result overwrites the first one's updatedCount.
  const inflight = useRef(new Set<string>());

  const rowFor = (label: string): RowState => rows[label] ?? { value: '' };
  const patchRow = (label: string, patch: Partial<RowState>) =>
    setRows((prev) => ({ ...prev, [label]: { ...rowFor(label), ...prev[label], ...patch } }));

  const validate = (label: string, value: string): string | undefined => {
    if (!value) {
      return 'Enter a new label name';
    }

    if (systemLabels.includes(value)) {
      return `"${value}" is also a reserved system name`;
    }

    const otherTargets = labels.filter((l) => l !== label).map((l) => rowFor(l).value);
    if (otherTargets.includes(value)) {
      return `"${value}" is already the target of another rename`;
    }

    return validateLabelName(value, []);
  };

  const rename = async (label: string) => {
    if (inflight.current.has(label) || rowFor(label).renamed) {
      return;
    }

    const value = rowFor(label).value;

    const validationError = validate(label, value);
    if (validationError) {
      patchRow(label, { error: validationError });
      return;
    }

    // pending freezes the row's input for the duration of the request, so the
    // locked row always displays the name that was actually sent.
    patchRow(label, { error: undefined, pending: true });
    inflight.current.add(label);

    try {
      const result = await renameMutation.mutateAsync({ from: label, to: value });
      patchRow(label, { renamed: true, updatedCount: result.updated_ids.length });
    } catch (err: unknown) {
      const e = err as { data?: { msg?: string } };
      patchRow(label, { error: e?.data?.msg ?? 'Failed to rename label' });
    } finally {
      patchRow(label, { pending: false });
      inflight.current.delete(label);
    }
  };

  const allRenamed = labels.every((label) => rowFor(label).renamed);

  return (
    <Stack direction="column" gap={1}>
      {labels.map((label) => {
        const row = rowFor(label);

        return (
          <Field
            key={label}
            invalid={!!row.error}
            error={row.error}
            label={
              <Text>
                <code>{label}</code>
              </Text>
            }
          >
            <Stack direction="row" gap={1} alignItems="center">
              <Input
                width={30}
                placeholder="New label name"
                disabled={disabled || row.pending || row.renamed}
                invalid={!!row.error}
                value={row.value}
                onChange={(e) => patchRow(label, { value: e.currentTarget.value, error: undefined })}
                data-testid={`rename-input-${label}`}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => rename(label)}
                disabled={disabled || row.pending || row.renamed || renameMutation.isPending}
              >
                Rename
              </Button>
              {row.renamed && (
                <Text color="secondary">
                  {row.updatedCount === 0
                    ? '✓ no checks carried this label — it may be set on a probe, which must be edited directly'
                    : `✓ renamed on ${row.updatedCount} check${row.updatedCount === 1 ? '' : 's'}`}
                </Text>
              )}
            </Stack>
          </Field>
        );
      })}
      <Space v={1} />
      <div>
        <Button onClick={onRetry} disabled={disabled || !allRenamed || retrying}>
          Retry enabling dual-write
        </Button>
      </div>
    </Stack>
  );
}
