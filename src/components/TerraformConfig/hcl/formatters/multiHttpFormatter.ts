import { Label } from 'types';

import { TFMultiHttpAssertion, TFMultiHttpEntry } from '../../terraformTypes';
import { HclValue, HclWriterInterface } from '../core/hclTypes';
import { isHclObject } from '../core/hclUtils';
import { formatSettingsToHcl } from './baseFormatter';

export function renderMultiHttpAssertions(assertions: TFMultiHttpAssertion[], writer: HclWriterInterface): string[] {
  const lines: string[] = [];

  assertions.forEach((assertion) => {
    const assertionLines: string[] = [];
    const assertionWriter = writer.child();

    Object.entries(assertion).forEach(([assertionKey, assertionValue]) => {
      if (assertionValue !== null && assertionValue !== undefined) {
        assertionLines.push(assertionWriter.writeArgument(assertionKey, assertionValue as HclValue));
      }
    });

    if (assertionLines.length > 0) {
      lines.push(...writer.writeBlock('assertions', assertionLines));
    }
  });

  return lines;
}

export function renderMultiHttpEntry(entry: TFMultiHttpEntry, writer: HclWriterInterface): string[] {
  const entryLines: string[] = [];
  const entryWriter = writer.child();

  const entryHandlers = {
    request: (value: TFMultiHttpEntry['request']) => {
      const requestLines = formatMultiHttpRequestToHcl(value!, entryWriter);
      return requestLines.length > 0 ? entryWriter.writeBlock('request', requestLines) : [];
    },
    assertions: (value: TFMultiHttpAssertion[]) => renderMultiHttpAssertions(value, entryWriter),
    variables: (value: any[]) => {
      const lines: string[] = [];
      value.forEach((variable) => {
        const variableLines: string[] = [];
        const variableWriter = entryWriter.child();

        Object.entries(variable).forEach(([varKey, varValue]) => {
          if (varValue !== null && varValue !== undefined) {
            variableLines.push(variableWriter.writeArgument(varKey, varValue as HclValue));
          }
        });

        if (variableLines.length > 0) {
          lines.push(...entryWriter.writeBlock('variables', variableLines));
        }
      });
      return lines;
    },
  };

  Object.entries(entry).forEach(([entryKey, entryValue]) => {
    if (entryValue === null || entryValue === undefined) {
      return;
    }

    const handler = entryHandlers[entryKey as keyof typeof entryHandlers];
    if (handler) {
      entryLines.push(...handler(entryValue));
      return;
    }

    entryLines.push(entryWriter.writeArgument(entryKey, entryValue as HclValue));
  });

  return entryLines;
}

export function renderMultiHttpEntries(entries: TFMultiHttpEntry[], writer: HclWriterInterface): string[] {
  const lines: string[] = [];

  entries.forEach((entry) => {
    const entryLines = renderMultiHttpEntry(entry, writer);

    if (entryLines.length > 0) {
      lines.push(...writer.writeBlock('entries', entryLines));
    }
  });

  return lines;
}

export function formatMultiHttpRequestToHcl(request: TFMultiHttpEntry['request'], writer: HclWriterInterface): string[] {
  const specialHandlers = {
    headers: (headers: HclValue, writer: HclWriterInterface) => {
      const lines: string[] = [];
      (headers as Label[]).forEach((header) => {
        const headerLines: string[] = [];
        const headerWriter = writer.child();

        headerLines.push(headerWriter.writeArgument('name', header.name));
        headerLines.push(headerWriter.writeArgument('value', header.value));

        lines.push(...writer.writeBlock('headers', headerLines));
      });
      return lines;
    },
    body: (body: HclValue, writer: HclWriterInterface) => {
      if (isHclObject(body)) {
        const bodyLines: string[] = [];
        const bodyWriter = writer.child();

        Object.entries(body).forEach(([bodyKey, bodyValue]) => {
          if (bodyValue !== null && bodyValue !== undefined) {
            bodyLines.push(bodyWriter.writeArgument(bodyKey, bodyValue as HclValue));
          }
        });

        return bodyLines.length > 0 ? writer.writeBlock('body', bodyLines) : [];
      }
      return [writer.writeArgument('body', body as HclValue)];
    },
    query_fields: (queryFields: HclValue, writer: HclWriterInterface) => {
      const lines: string[] = [];
      (queryFields as Label[]).forEach((field) => {
        if (isHclObject(field)) {
          const fieldLines: string[] = [];
          const fieldWriter = writer.child();

          Object.entries(field).forEach(([fieldKey, fieldValue]) => {
            if (fieldValue !== null && fieldValue !== undefined) {
              fieldLines.push(fieldWriter.writeArgument(fieldKey, fieldValue as HclValue));
            }
          });

          if (fieldLines.length > 0) {
            lines.push(...writer.writeBlock('query_fields', fieldLines));
          }
        }
      });
      return lines;
    },
  };

  return formatSettingsToHcl(request as unknown as Record<string, HclValue>, writer, specialHandlers);
}

export function formatMultiHttpSettingsToHcl(
  multiHttpSettings: Record<string, HclValue>,
  writer: HclWriterInterface
): string[] {
  const specialHandlers = {
    entries: (entries: HclValue) => renderMultiHttpEntries(entries as TFMultiHttpEntry[], writer),
  };

  return formatSettingsToHcl(multiHttpSettings, writer, specialHandlers);
}
