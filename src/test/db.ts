import { faker } from '@faker-js/faker';
import { factory, primaryKey } from '@mswjs/data';

import { CheckAlertType } from 'types';

export const db = factory({
  probe: {
    id: primaryKey(() => faker.number.int({ min: 1, max: 999 })),
    name: () => faker.string.uuid(),
    public: () => faker.datatype.boolean(),
    latitude: () => faker.location.latitude(),
    longitude: () => faker.location.longitude(),
    region: () => faker.helpers.arrayElement(['EMEA', 'AMER', 'APAC']),
    labels: () => [{ name: faker.animal.petName(), value: faker.color.human() } as any],
    online: () => faker.datatype.boolean(),
    onlineChange: () => faker.date.past().getTime() / 1000,
    version: () => faker.system.semver(),
    deprecated: () => false,
    modified: () => Math.floor(faker.date.recent().getTime() / 1000),
    created: () => Math.floor(faker.date.past().getTime() / 1000),
    capabilities: {
      disableScriptedChecks: () => faker.datatype.boolean(),
      disableBrowserChecks: () => faker.datatype.boolean(),
    } as any,
  },
  alert: {
    id: primaryKey(() => faker.number.int({ min: 1, max: 999 })),
    name: () => faker.helpers.arrayElement(Object.values(CheckAlertType)),
    threshold: () => faker.number.int({ min: 50, max: 500 }),
    created: () => Math.floor(faker.date.past().getTime() / 1000),
    modified: () => Math.floor(faker.date.recent().getTime() / 1000),
  },
});
