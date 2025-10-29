import React, { useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button, IconButton, Stack } from '@grafana/ui';

import { CheckFormValues, HttpMethod } from 'types';

import { FIELD_SPACING } from '../../constants';
import { useEntryHasError } from '../../hooks/useEntryHasError';
import { useGetIndexFieldError } from '../../hooks/useGetIndexFieldError';
import { createPath } from '../../utils/form';
import { AdditionalSettings } from '../AdditionalSettings';
import { CollapsibleRequestEntry } from '../CollapsibleRequestEntry';
import { GenericInputField } from './generic/GenericInputField';
import { GenericNameValueField } from './generic/GenericNameValueField';
import { GenericTextareaField } from './generic/GenericTextareaField';
import { FormHttpRequestMethodTargetFields } from './FormHttpRequestMethodTargetFields';
import { createFieldListRegExps } from './FormMultiHttpEntriesField.utils';
import { FormMultiHttpVariablesField } from './FormMultiHttpVariablesField';
import { FormTabContent, FormTabs } from './FormTabs';
import { MultiHttpAvailableVariables } from './MultiHttpAvailableVariables';

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

// This is used to create index specific regexp
const REQUEST_OPTIONS_TAB_FIELDS_TEMPLATE = [
  ['.entries.{index}.request.headers'],
  ['.entries.{index}.request.queryFields'],
];

const REQUEST_VARIABLES_FIELDS_TEMPLATE = [['.entries.{index}.variables']];

interface MultiHttpEntryProps extends FormMultiHttpEntriesFieldProps {
  index: number;
  onDelete(index: number): void;
  onMove(currentIndex: number, newIndex: number): void;
  entryCount: number;
}

function MultiHttpEntry({ field, index, onDelete, onMove, entryCount }: MultiHttpEntryProps) {
  const {
    watch,
    getValues,
    setValue,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();

  // Create index specific regexp to check for errors within options and variables buttons
  const [requestOptionsTabFields, requestVariablesFields] = useMemo(() => {
    return [
      createFieldListRegExps(REQUEST_OPTIONS_TAB_FIELDS_TEMPLATE, index),
      createFieldListRegExps(REQUEST_VARIABLES_FIELDS_TEMPLATE, index),
    ];
  }, [index]);

  const hasError = useEntryHasError(field, index);
  const tabIndexErrors = useGetIndexFieldError(requestOptionsTabFields);
  const hasRequestOptionError = tabIndexErrors.some((item) => item);
  const [hasVariablesError] = useGetIndexFieldError(requestVariablesFields);

  const method = getValues(createPath(field, index, 'request.method'));
  const target = getValues(createPath(field, index, 'request.url'));

  // Simplest way to maintain collapsible state while moving stuff around
  const isOpen = watch(createPath(field, index, '_isOpen.request'), true);
  const handleToggle = () => setValue(createPath(field, index, '_isOpen.request'), !isOpen);

  const isFirst = index === 0;
  const isLast = index === entryCount - 1;

  return (
    <CollapsibleRequestEntry
      aria-label={`Request entry ${index + 1}`}
      hasError={hasError}
      method={method}
      target={target}
      placeholder={`Request ${index + 1}`}
      isOpen={isOpen}
      onToggle={handleToggle}
      actions={
        <>
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
        </>
      }
    >
      <MultiHttpAvailableVariables requestIndex={index} />
      {/* withQueryParams doesn't play nice with variables, as they are encoded */}
      <FormHttpRequestMethodTargetFields
        field={createPath(field, index, 'request.url')}
        methodField={createPath(field, index, 'request.method')}
        aria-label={`Request target for request ${index + 1}`}
      />
      <AdditionalSettings isOpen={hasRequestOptionError} buttonLabel="Request options" indent>
        <FormTabs tabErrorIndexes={tabIndexErrors}>
          <FormTabContent label="Options">
            <GenericNameValueField
              label="Request headers"
              description="The HTTP headers to be sent with the request."
              allowEmpty
              field={createPath(field, index, 'request.headers')}
              addButtonText="Header"
              interpolationVariables={{ type: 'Header' }}
            />
          </FormTabContent>
          <FormTabContent label="Query parameters">
            <GenericNameValueField
              label="Query parameters"
              description={`The query parameters sent with the request. These parameters reduce cardinality when displaying URLs in dashboards. If you need higher cardinality, add your query parameters to the "Request target" field instead. `}
              allowEmpty
              field={createPath(field, index, 'request.queryFields')}
              addButtonText="Query parameter"
              interpolationVariables={{ type: 'Query parameter' }}
            />
          </FormTabContent>

          <FormTabContent label="Body">
            <GenericInputField
              field={createPath(field, index, 'request.body.contentType')}
              label="Content type"
              description="Indicates the media type of the body."
            />
            <GenericInputField
              field={createPath(field, index, 'request.body.contentEncoding')}
              label="Content encoding"
              description="Indicates the content encoding of the body."
            />

            <GenericTextareaField
              field={createPath(field, index, 'request.body.payload')}
              label="Request body"
              description="The body of the HTTP request used in request."
              rows={10}
            />
          </FormTabContent>
        </FormTabs>
      </AdditionalSettings>
      <AdditionalSettings buttonLabel="Variables" isOpen={hasVariablesError} indent>
        <FormMultiHttpVariablesField field={createPath(field, index, 'variables')} />
      </AdditionalSettings>
    </CollapsibleRequestEntry>
  );
}
