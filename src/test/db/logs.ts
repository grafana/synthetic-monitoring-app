import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

type AnyLabels = Record<string, string>;
type AnyLabelTypes = Record<string, string>;

export const logsFactory = Factory.define<ParsedLokiRecord<AnyLabels, AnyLabelTypes>>(({}) => ({
  [LokiFieldNames.Labels]: {},
  [LokiFieldNames.Time]: faker.date.recent().getTime(),
  [LokiFieldNames.Line]: faker.lorem.word(),
  [LokiFieldNames.TsNs]: faker.date.recent().getTime(),
  [LokiFieldNames.LabelTypes]: {},
  [LokiFieldNames.ID]: faker.string.uuid(),
}));
