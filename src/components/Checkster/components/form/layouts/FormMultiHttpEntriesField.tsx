import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button, Icon, IconButton, Stack, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormValues, HttpMethod } from 'types';
import { getMethodColor } from 'utils';

import { FIELD_SPACING } from '../../../constants';
import { createPath } from '../../../utils/form';
import { AdditionalSettings } from '../../AdditionalSettings';
import { FormHttpRequestMethodTargetFields } from '../FormHttpRequestMethodTargetFields';
import { FormMultiHttpVariablesField } from '../FormMultiHttpVariablesField';
import { GenericNameValueField } from '../generic/GenericNameValueField';

interface FormMultiHttpEntriesFieldProps {
  field: 'settings.multihttp.entries';
}

const MAX_MULTI_HTTP_REQUEST = 10;

export function FormMultiHttpEntriesField({ field }: FormMultiHttpEntriesFieldProps) {
  const {
    control,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const { fields: entries, append, remove, move } = useFieldArray({ control, name: field });

  const limitReached = entries.length >= MAX_MULTI_HTTP_REQUEST;

  return (
    <Stack direction="column" gap={FIELD_SPACING}>
      {entries.map((entry, index) => {
        return (
          <MultiHttpEntry
            key={entry.id}
            field={field}
            index={index}
            onDelete={remove}
            onMove={move}
            entryCount={entries.length}
          />
        );
      })}
      <div>
        <Button
          variant="secondary"
          type="button"
          icon="plus"
          onClick={() => {
            append({
              request: { url: ``, method: HttpMethod.GET },
            });
          }}
          disabled={disabled || limitReached}
          tooltip={limitReached ? 'Maximum of 10 requests per check' : undefined}
          tooltipPlacement="bottom-start"
        >
          Request
        </Button>
      </div>
    </Stack>
  );
}

interface MultiHttpEntryProps extends FormMultiHttpEntriesFieldProps {
  index: number;
  onDelete(index: number): void;
  onMove(currentIndex: number, newIndex: number): void;
  entryCount: number;
}

function MultiHttpEntry({ field, index, onDelete, onMove, entryCount }: MultiHttpEntryProps) {
  const theme = useTheme2();
  const {
    watch,
    getValues,
    setValue,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const method = getValues(createPath(field, index, 'request.method'));
  const target = getValues(createPath(field, index, 'request.target'));
  const isOpen = watch(createPath(field, index, '_isOpen.request'), true);
  // Simplest way to maintain collapsible state while moving stuff around
  const handleToggle = () => setValue(createPath(field, index, '_isOpen.request'), !isOpen);
  const isFirst = index === 0;
  const isLast = index === entryCount - 1;

  return (
    <Stack direction="column" gap={1}>
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-right: ${theme.spacing(1)};

          &:hover {
            background-color: ${theme.colors.background.secondary};
          }
        `}
      >
        <h5
          onClick={handleToggle}
          className={css`
            align-items: center;
            display: flex;
            gap: ${theme.spacing(1)};
            flex-grow: 1;
            cursor: pointer;
            margin: 0;
            padding: ${theme.spacing(1)};
          `}
        >
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
          <span
            className={css`
              color: ${getMethodColor(theme, method)};
            `}
          >
            {method}
          </span>
          <span
            className={cx(
              !target &&
                css`
                  color: ${theme.colors.text.disabled};
                `
            )}
          >
            {target || `Request ${index + 1}`}
          </span>
        </h5>
        <Stack gap={1}>
          <IconButton
            disabled={disabled || isFirst}
            name="arrow-up"
            aria-label="Move request up"
            onClick={() => onMove(index, index - 1)}
          />
          <IconButton
            disabled={disabled || isLast}
            name="arrow-down"
            aria-label="Move request down"
            onClick={() => onMove(index, index + 1)}
          />
          <IconButton
            disabled={disabled || isFirst}
            aria-label="Delete request"
            name="trash-alt"
            onClick={() => onDelete(index)}
          />
        </Stack>
      </div>
      {isOpen && (
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: ${theme.spacing(1)};
            margin-left: ${theme.spacing(4)};
            padding: ${theme.spacing(0, 2)};
            border-left: 1px solid ${theme.colors.border.medium};
          `}
        >
          {/* withQueryParams doesn't play nice with variables, as they are encoded */}
          <FormHttpRequestMethodTargetFields
            field={createPath(field, index, 'request.target')}
            methodField={createPath(field, index, 'request.method')}
          />
          <AdditionalSettings buttonLabel="Request options" indent>
            <GenericNameValueField
              label="Request headers"
              description="The HTTP headers to be sent with the request."
              allowEmpty
              field={createPath(field, index, 'request.headers')}
              addButtonText="Header"
              interpolationVariables={{ type: 'Header' }}
            />
          </AdditionalSettings>
          <AdditionalSettings isOpen buttonLabel="Variables" indent>
            <FormMultiHttpVariablesField field={createPath(field, index, 'variables')} />
          </AdditionalSettings>
        </div>
      )}
    </Stack>
  );
}
