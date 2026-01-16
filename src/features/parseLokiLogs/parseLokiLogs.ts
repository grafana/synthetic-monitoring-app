import { Field } from '@grafana/data';

import {
  ID,
  Labels,
  LabelTypes,
  Line,
  LokiDataFrame,
  LokiFieldNames,
  LokiFieldNamesNew,
  LokiFields,
  ParsedLokiRecord,
  Time,
  TsNs,
} from 'features/parseLokiLogs/parseLokiLogs.types';

type FieldParser = Partial<Record<LokiFieldNames, (value: any) => any>>;

// Expects structured log data from Loki. LogQL queries must include '| logfmt'
// parser to extract individual fields before calling this function.
export function parseLokiLogs<T, R>(dataFrame: LokiDataFrame<T, R>, parser?: FieldParser) {
  const normalizedDataFrame = normalizeLokiDataFrame(dataFrame);
  // After normalization, fields are guaranteed to be LokiFields<T, R>
  const flattenedLogs = flattenLogs(normalizedDataFrame.fields as LokiFields<T, R>, parser);
  const sortedLogs = sortLogs(flattenedLogs);

  return sortedLogs;
}

/**
 * Normalizes a LokiDataFrame to use standard field names (Time, Line, tsNs).
 * Detects schema by checking field names and converts new schema (timestamp, body) to old schema (Time, Line).
 */
export function normalizeLokiDataFrame<T, R>(dataFrame: LokiDataFrame<T, R>): LokiDataFrame<T, R> {
  const fields = dataFrame.fields;

  // Check if this is new schema by looking for 'timestamp' or 'body' field names
  const isNewSchema = fields.some(
    (field) => field.name === LokiFieldNamesNew.Time || field.name === LokiFieldNamesNew.Line
  );

  // If old schema, return as-is
  if (!isNewSchema) {
    return dataFrame;
  }

  // Normalize new schema fields
  const normalizedFields: Field[] = fields.map((field) => {
    // Map new schema field names to normalized names
    if (field.name === LokiFieldNamesNew.Time) {
      return {
        ...field,
        name: LokiFieldNames.Time,
      } as Time;
    }
    if (field.name === LokiFieldNamesNew.Line) {
      return {
        ...field,
        name: LokiFieldNames.Line,
      } as Line;
    }
    if (field.name === LokiFieldNamesNew.TsNs) {
      return {
        ...field,
        name: LokiFieldNames.TsNs,
      } as TsNs;
    }
    // Labels, LabelTypes, and ID should already match, but ensure they're correct
    if (field.name === LokiFieldNames.Labels) {
      return field as Labels<T>;
    }
    if (field.name === LokiFieldNames.LabelTypes) {
      return field as LabelTypes<R>;
    }
    if (field.name === LokiFieldNames.ID) {
      return field as ID;
    }
    // Fallback: return field as-is
    return field;
  });

  // Ensure fields are in correct order: [Labels, Time, Line, TsNs?, LabelTypes, ID]
  // Find each field by its normalized name
  const labelsField = normalizedFields.find((f) => f.name === LokiFieldNames.Labels) as Labels<T>;
  const timeField = normalizedFields.find((f) => f.name === LokiFieldNames.Time) as Time;
  const lineField = normalizedFields.find((f) => f.name === LokiFieldNames.Line) as Line;
  const tsNsField = normalizedFields.find((f) => f.name === LokiFieldNames.TsNs) as TsNs | undefined;
  const labelTypesField = normalizedFields.find((f) => f.name === LokiFieldNames.LabelTypes) as LabelTypes<R>;
  const idField = normalizedFields.find((f) => f.name === LokiFieldNames.ID) as ID;

  // Build normalized fields array - tsNs might be missing in new schema
  // If tsNs is missing, create a placeholder field with undefined values (will be derived in flattenLogs)
  const valuesLength = labelsField.values.length;
  const tsNsFieldNormalized: TsNs =
    tsNsField ||
    ({
      name: LokiFieldNames.TsNs,
      type: 'string' as const,
      values: new Array(valuesLength).fill(undefined) as string[],
      config: {},
      typeInfo: { frame: 'string' },
    } as TsNs);

  const normalizedFieldsArray: LokiFields<T, R> = [
    labelsField,
    timeField,
    lineField,
    tsNsFieldNormalized,
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
    const aTsNs = a[LokiFieldNames.TsNs] ?? (a[LokiFieldNames.Time] ?? 0) * 1000000;
    const bTsNs = b[LokiFieldNames.TsNs] ?? (b[LokiFieldNames.Time] ?? 0) * 1000000;
    return aTsNs - bTsNs;
  });
}

// Map API field names to normalized LokiFieldNames
function normalizeFieldName(fieldName: string): LokiFieldNames {
  // Handle new schema field names
  if (fieldName === 'timestamp') {
    return LokiFieldNames.Time;
  }
  if (fieldName === 'body') {
    return LokiFieldNames.Line;
  }
  // Handle old schema or already normalized names
  if (Object.values(LokiFieldNames).includes(fieldName as LokiFieldNames)) {
    return fieldName as LokiFieldNames;
  }
  // Fallback: try to match by case-insensitive comparison
  const lowerName = fieldName.toLowerCase();
  if (lowerName === 'time' || lowerName === 'timestamp') {
    return LokiFieldNames.Time;
  }
  if (lowerName === 'line' || lowerName === 'body') {
    return LokiFieldNames.Line;
  }
  if (lowerName === 'tsns' || lowerName === 'ts_ns') {
    return LokiFieldNames.TsNs;
  }
  // Default: return as-is (for labels, labelTypes, id which should match)
  return fieldName as LokiFieldNames;
}

export function flattenLogs<T, R>(fields: LokiFields<T, R>, parser?: FieldParser) {
  const valuesLength = fields[0].values.length;
  let flattenedLogs: Array<ParsedLokiRecord<T, R>> = [];

  const combinedParser: FieldParser = {
    [LokiFieldNames.TsNs]: (value: string) => Number(value),
    ...parser,
  };

  for (let i = 0; i < valuesLength; i++) {
    const records = fields.map((entry) => {
      const normalizedKey = normalizeFieldName(entry.name);
      const fieldParser = combinedParser?.[normalizedKey];
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

    // Derive tsNs from Time if missing
    if (!values[LokiFieldNames.TsNs] && values[LokiFieldNames.Time]) {
      values[LokiFieldNames.TsNs] = values[LokiFieldNames.Time] * 1000000;
    }

    flattenedLogs.push(values);
  }

  return flattenedLogs;
}
