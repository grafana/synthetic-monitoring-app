import { Field } from '@grafana/data';

import {
  Body,
  ID,
  Labels,
  LabelTypes,
  LokiDataFrame,
  LokiFieldNames,
  LokiFieldNamesOld,
  LokiFields,
  ParsedLokiRecord,
  TimeStamp,
  TsNsOld,
} from 'features/parseLokiLogs/parseLokiLogs.types';

type FieldParser = Partial<Record<LokiFieldNamesOld | LokiFieldNames, (value: any) => any>>;

// Expects structured log data from Loki. LogQL queries must include '| logfmt'
// parser to extract individual fields before calling this function.
export function parseLokiLogs<T, R>(dataFrame: LokiDataFrame<T, R>, parser?: FieldParser) {
  const normalizedDataFrame = normalizeLokiDataFrame(dataFrame);
  // After normalization, fields are guaranteed to be LokiFields<T, R>
  if (!isLokiFields(normalizedDataFrame.fields)) {
    // Log error but return empty array to prevent UI crashes
    console.error('Failed to normalize LokiDataFrame fields', normalizedDataFrame);
    return [];
  }
  const flattenedLogs = flattenLogs(normalizedDataFrame.fields, parser);
  const sortedLogs = sortLogs(flattenedLogs);

  return sortedLogs;
}

function isLokiFields<T, R>(fields: Field[]): fields is LokiFields<T, R> {
  return (
    fields.some(isLabels) &&
    fields.some(isTimeStamp) &&
    fields.some(isBody) &&
    fields.some(isLabelTypes) &&
    fields.some(isID)
  );
}

/**
 * Normalizes a LokiDataFrame to use new schema field names (timestamp, body).
 * Detects schema by checking field names and converts old schema (Time, Line) to new schema (timestamp, body).
 * Old schema's tsNs field is converted to timestamp.nanos property.
 */
export function normalizeLokiDataFrame<T, R>(dataFrame: LokiDataFrame<T, R>): LokiDataFrame<T, R> {
  const fields = dataFrame.fields;

  // Check if this is old schema by looking for 'Time' or 'Line' field names
  const isOldSchema = fields.some(isTimeOld) || fields.some(isLineOld);

  // If already new schema, return as-is (but ensure nanos is present)
  if (!isOldSchema) {
    const timeField = fields.find(isTimeStamp);
    if (timeField && !('nanos' in timeField)) {
      // Ensure nanos property exists
      const updatedFields: Field[] = fields.map((f) => (isTimeStamp(f) ? { ...f, nanos: [] } : f));
      // TypeScript can't infer that updatedFields is LokiFields<T, R>, but we know it is
      // since we only modified the timestamp field to add nanos
      return {
        ...dataFrame,
        fields: updatedFields as LokiFields<T, R>,
      };
    }
    return dataFrame;
  }

  // Normalize fields: convert old schema to new schema
  const normalizedFields: Field[] = fields.map((field) => {
    // Map old schema field names to new schema names
    if (isTimeOld(field)) {
      return {
        ...field,
        name: LokiFieldNames.TimeStamp,
      } satisfies TimeStamp;
    }
    if (isLineOld(field)) {
      return {
        ...field,
        name: LokiFieldNames.Body,
      } satisfies Body;
    }
    // Handle new schema fields that are already normalized
    if (isTimeStamp(field)) {
      return field;
    }
    if (isBody(field)) {
      return field;
    }
    // Labels, LabelTypes, and ID should already match, but ensure they're correct
    if (isLabels<T>(field)) {
      return field;
    }
    if (isLabelTypes<R>(field)) {
      return field;
    }
    if (isID(field)) {
      return field;
    }
    // Fallback: return field as-is
    return field;
  });

  // Find old schema tsNs field to populate nanos
  const tsNsField = fields.find(isTsNsOld);

  // Ensure fields are in correct order: [Labels, timestamp, body, labelTypes, id]
  // Find each field by its normalized name
  const labelsField = normalizedFields.find(isLabels<T>);
  const timeField = normalizedFields.find(isTimeStamp);
  const lineField = normalizedFields.find(isBody);
  const labelTypesField = normalizedFields.find(isLabelTypes<R>);
  const idField = normalizedFields.find(isID);

  if (!labelsField || !timeField || !lineField || !labelTypesField || !idField) {
    throw new Error('Failed to find all required fields after normalization');
  }

  // Populate nanos from old schema's tsNs field
  const valuesLength = labelsField.values.length;
  const nanos: number[] = tsNsField
    ? Array.isArray(tsNsField.values)
      ? tsNsField.values.map((v) => Number(v))
      : []
    : (timeField.nanos ?? new Array(valuesLength).fill(0));

  const timeFieldWithNanos: TimeStamp = {
    ...timeField,
    nanos,
  };

  const normalizedFieldsArray: LokiFields<T, R> = [
    labelsField,
    timeFieldWithNanos,
    lineField,
    labelTypesField,
    idField,
  ];

  return {
    ...dataFrame,
    fields: normalizedFieldsArray,
  };
}

export function sortLogs<T, R>(logs: Array<ParsedLokiRecord<T, R>>) {
  return logs.sort((a, b) => {
    const aTsNs = (a[LokiFieldNames.TimeStamp] ?? 0) * 1000000 + (a.nanos ?? 0);
    const bTsNs = (b[LokiFieldNames.TimeStamp] ?? 0) * 1000000 + (b.nanos ?? 0);
    return aTsNs - bTsNs;
  });
}

// Type guards to avoid type assertions
function isTimeStamp(field: Field): field is TimeStamp {
  return field.name === LokiFieldNames.TimeStamp;
}

function isBody(field: Field): field is Body {
  return field.name === LokiFieldNames.Body;
}

function isLabels<T>(field: Field): field is Labels<T> {
  return field.name === LokiFieldNames.Labels;
}

function isLabelTypes<R>(field: Field): field is LabelTypes<R> {
  return field.name === LokiFieldNames.LabelTypes;
}

function isID(field: Field): field is ID {
  return field.name === LokiFieldNames.ID;
}

function isTsNsOld(field: Field): field is TsNsOld {
  return field.name === LokiFieldNamesOld.TsNs;
}

function isTimeOld(field: Field): field is Field<number> & { name: LokiFieldNamesOld.Time } {
  return field.name === LokiFieldNamesOld.Time;
}

function isLineOld(field: Field): field is Field<string> & { name: LokiFieldNamesOld.Line } {
  return field.name === LokiFieldNamesOld.Line;
}

// Map API field names to normalized new schema
function normalizeFieldName(fieldName: string): LokiFieldNames | LokiFieldNamesOld {
  // Handle old schema field names - convert to new schema
  if (fieldName === LokiFieldNamesOld.Time || fieldName === 'Time') {
    return LokiFieldNames.TimeStamp;
  }
  if (fieldName === LokiFieldNamesOld.Line || fieldName === 'Line') {
    return LokiFieldNames.Body;
  }
  // Handle new schema field names - already normalized
  if (fieldName === LokiFieldNames.TimeStamp || fieldName === 'timestamp') {
    return LokiFieldNames.TimeStamp;
  }
  if (fieldName === LokiFieldNames.Body || fieldName === 'body') {
    return LokiFieldNames.Body;
  }
  // Handle old schema tsNs (not in new schema)
  if (fieldName === LokiFieldNamesOld.TsNs || fieldName === 'tsNs') {
    return LokiFieldNamesOld.TsNs;
  }
  // Handle labels, labelTypes, id (same in both schemas)
  if (fieldName === LokiFieldNamesOld.Labels || fieldName === LokiFieldNames.Labels) {
    return LokiFieldNames.Labels;
  }
  if (fieldName === LokiFieldNamesOld.LabelTypes || fieldName === LokiFieldNames.LabelTypes) {
    return LokiFieldNames.LabelTypes;
  }
  if (fieldName === LokiFieldNamesOld.ID || fieldName === LokiFieldNames.ID) {
    return LokiFieldNames.ID;
  }
  // Fallback: try to match by case-insensitive comparison
  const lowerName = fieldName.toLowerCase();
  if (lowerName === 'time' || lowerName === 'timestamp') {
    return LokiFieldNames.TimeStamp;
  }
  if (lowerName === 'line' || lowerName === 'body') {
    return LokiFieldNames.Body;
  }
  // Default: return as-is (for labels, labelTypes, id which should match)
  // This should only happen for labels, labelTypes, or id which are the same in both schemas
  if (fieldName === LokiFieldNames.Labels) {
    return LokiFieldNames.Labels;
  }
  if (fieldName === LokiFieldNames.LabelTypes) {
    return LokiFieldNames.LabelTypes;
  }
  if (fieldName === LokiFieldNames.ID) {
    return LokiFieldNames.ID;
  }
  throw new Error(`Unknown field name: ${fieldName}`);
}

function getFieldParser(
  parser: FieldParser,
  key: LokiFieldNames | LokiFieldNamesOld
): ((value: any) => any) | undefined {
  // TypeScript has difficulty with overlapping enum types (LokiFieldNamesOld.Labels === LokiFieldNames.Labels)
  // We verify the key exists before accessing to make this safe
  const parserRecord = parser as Record<string, (value: any) => any>;
  return parserRecord[key] ?? undefined;
}

export function flattenLogs<T, R>(fields: LokiFields<T, R>, parser?: FieldParser) {
  const valuesLength = fields[0].values.length;
  let flattenedLogs: Array<ParsedLokiRecord<T, R>> = [];

  const combinedParser: FieldParser = {
    ...parser,
  };

  // Find timestamp field to extract nanos
  const timeField = fields.find(isTimeStamp);

  for (let i = 0; i < valuesLength; i++) {
    const records = fields.map((entry) => {
      const normalizedKey = normalizeFieldName(entry.name);
      const fieldParser = getFieldParser(combinedParser, normalizedKey);
      const value = entry.values[i];

      return {
        [normalizedKey]: fieldParser ? fieldParser(value) : value,
      };
    });

    const values = records.reduce<ParsedLokiRecord<T, R>>(
      (acc, curr) => ({
        ...acc,
        ...curr,
      }),
      {} as ParsedLokiRecord<T, R>
    );

    // Extract nanos from timestamp field's nanos property
    const nanos =
      timeField?.nanos?.[i] ?? (values[LokiFieldNames.TimeStamp] ? values[LokiFieldNames.TimeStamp] * 1000000 : 0);
    values.nanos = nanos;

    flattenedLogs.push(values);
  }

  return flattenedLogs;
}
