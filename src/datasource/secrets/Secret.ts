import { config } from '@grafana/runtime';

import { Secret } from '../types';

export class SecretObject implements Secret {
  created_at = Date.now();
  created_by = config.bootData.user.name;
  description = '';
  labels: Secret['labels'] = [];
  name = '';
  orgId = config.bootData.user.orgId;
  stackId = config.bootData.user.orgId + 1000;
  uuid = SecretObject.uuid();
  version = 1;

  constructor(name: string, randomDate = true, version?: number) {
    this.name = name;
    if (version) {
      this.version = version;
    }

    if (randomDate) {
      this.created_at = SecretObject.randomDate('2024-06-06').getTime();
    }
  }

  public static uuid() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
      (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
    );
  }

  public static randomDate(start: string, end?: string) {
    const startDate = new Date(start);
    const endDate = new Date(end ? end : Date.now());

    return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
  }

  public toObject(): Secret {
    return {
      ...this,
    };
  }
}
