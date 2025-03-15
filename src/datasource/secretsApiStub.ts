import { config } from '@grafana/runtime';

import { ExperimentalSecret, ExperimentalSecretsResponse } from 'data/useSecrets';
import {
  generateUuid,
  SecretFormValues,
} from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

declare global {
  interface Window {
    secretsApiStub?: SecretsApiStub;
  }
}

type KnownPath = '/secrets' | '/secrets/find_by_labels' | `/secrets/${number | string}`;

interface PersistentState {
  secrets: Record<string, ExperimentalSecret>;
}

const PERSISTENT_STATE_KEY = 'experimental-synthetic-monitoring-secrets';
const STUB_SECRET_1 = {
  name: 'my_secret',
  description: 'My secret',
  labels: [
    {
      name: 'team',
      value: 'development',
    },
  ],
  uuid: '01543325-00b3-4f69-b124-51f54835a245',
  org_id: 1,
  stack_id: 1,
  created_by: 'Swagger Editor',
  created_at: 1741937413447,
  modified_at: 1741937413447,
};

const STUB_SECRET_2 = {
  name: 'mocked_secret',
  description: 'This secret is mocked',
  labels: [
    {
      name: 'service',
      value: 'service1',
    },
    {
      name: 'type',
      value: 'mocked',
    },
  ],
  uuid: '02543325-00b3-4f69-b124-51f54835a245',
  org_id: 2,
  stack_id: 2,
  created_by: 'System',
  created_at: 1741937413447,
  modified_at: 1741937413447,
};

function payload<T>(payload: T, min = 10, max = 500): Promise<T> {
  const delay = Math.max(min, Math.random() * max);
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay);
  });
}

const STUB_SEED = {
  secrets: {
    [STUB_SECRET_1.uuid]: STUB_SECRET_1,
    [STUB_SECRET_2.uuid]: STUB_SECRET_2,
  },
};

class SecretsApiStub {
  private state: PersistentState = { secrets: {} };

  constructor() {
    this.initialize();
    window.secretsApiStub = this;
  }

  private initialize() {
    try {
      const state = localStorage.getItem(PERSISTENT_STATE_KEY);
      if (state) {
        this.state = JSON.parse(state);
      }
    } catch (error) {
      this.reset();
    }
  }

  private persist() {
    localStorage.setItem(PERSISTENT_STATE_KEY, JSON.stringify(this.state));
  }

  public reset() {
    localStorage.removeItem(PERSISTENT_STATE_KEY);
    this.state = { secrets: {} };
    this.persist();
  }

  async get<ReturnType = ExperimentalSecretsResponse>(path: KnownPath): Promise<ReturnType> {
    if (path === '/secrets') {
      return (await payload({ secrets: Object.values(this.state.secrets) })) as ReturnType;
    } else if (path.includes('/secrets/')) {
      const [_, id] = path.split('/').filter(Boolean);
      if (this.state.secrets.hasOwnProperty(id)) {
        return (await payload(this.state.secrets[id])) as ReturnType;
      }
      throw new Error('Secret not found');
    }

    throw new Error('Not implemented');
  }

  async post(path: KnownPath, body: SecretFormValues & { plaintext?: string }) {
    if (path === '/secrets') {
      const { plaintext, ...cleanData } = body;
      const secret: ExperimentalSecret = {
        ...cleanData,
        uuid: generateUuid(),
        org_id: 1,
        stack_id: 1,
        created_by: config.bootData.user.name,
        created_at: Date.now(),
        modified_at: Date.now(),
      };

      this.state.secrets[secret.uuid] = secret;
      this.persist();

      return payload(secret);
    }

    throw new Error('Not implemented');
  }

  async put(path: KnownPath, body: Partial<ExperimentalSecret & { plaintext?: string }>) {
    if (path.includes('/secrets/')) {
      const [_, id] = path.split('/').filter(Boolean);
      if (this.state.secrets.hasOwnProperty(id)) {
        const { plaintext, ...secret } = body;
        this.state.secrets[id] = { ...this.state.secrets[id], ...secret, modified_at: Date.now() };
        this.persist();

        return payload(this.state.secrets[id]);
      }
    }

    throw new Error('Not implemented');
  }

  async delete(path: KnownPath) {
    const [_, id] = path.split('/').filter(Boolean);
    console.log('delete', path, id);
    if (this.state.secrets.hasOwnProperty(id)) {
      delete this.state.secrets[id];
      this.persist();
      return;
    } else if (!!id) {
      throw new Error('Not found');
    }

    throw new Error('Not implemented');
  }

  public seed() {
    this.state = STUB_SEED;
    this.persist();
  }
}

export const secretsApiStub = new SecretsApiStub();
