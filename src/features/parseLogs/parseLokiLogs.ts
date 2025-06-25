import { LokiFieldNames, LokiFields, LokiSeries, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

type FieldParser = Partial<Record<LokiFieldNames, (value: any) => any>>;

// ensure to send logfmt to Loki so the line is fully parsed
export function parseLokiLogs<T, R>(dataFrame: LokiSeries<T, R>, parser?: FieldParser) {
  const flattenedLogs = flattenLogs(dataFrame.fields, parser);

  return sortLogs(flattenedLogs);
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
      const key: LokiFieldNames = entry.name;
      const fieldParser = combinedParser?.[key];
      const value = entry.values[i];

      return {
        [key]: fieldParser ? fieldParser(value) : value,
      };
    });

    const values = records.reduce<ParsedLokiRecord<T, R>>(
      (acc, curr) => ({
        ...acc,
        ...curr,
      }),
      {} as ParsedLokiRecord<T, R>
    );

    flattenedLogs.push(values);
  }

  return flattenedLogs;
}

export function sortLogs<T, R>(logs: Array<ParsedLokiRecord<T, R>>) {
  return logs.sort((a, b) => a[LokiFieldNames.TsNs] - b[LokiFieldNames.TsNs]);
}
