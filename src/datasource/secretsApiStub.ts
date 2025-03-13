import { ExperimentalSecret, ExperimentalSecretsResponse } from '../data/useSecrets';

declare global {
  interface Window {
    secretsApiStub?: SecretsApiStub;
  }
}

type KnownPath = '/secrets' | '/secrets/find_by_labels' | `/secrets/${number}`;

interface PersistentState {
  secrets: Record<string, ExperimentalSecret>;
}

const PERSISTENT_STATE_KEY = 'experimental-synthetic-monitoring-secrets';

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

  async get(path: KnownPath): Promise<ExperimentalSecretsResponse> {
    if (path === '/secrets') {
      return { secrets: Object.values(this.state.secrets) };
    }

    throw new Error('Not implemented');
  }

  async post(path: KnownPath, body: unknown) {
    throw new Error('Not implemented');
  }

  async put(path: KnownPath, body: unknown) {
    throw new Error('Not implemented');
  }

  async delete(path: KnownPath) {
    const [_, id] = path.split('/');
    if (this.state.secrets.hasOwnProperty(id)) {
      delete this.state.secrets[id];
      this.persist();
      return;
    } else if (!!id) {
      throw new Error('Not found');
    }

    throw new Error('Not implemented');
  }
}

export const secretsApiStub = new SecretsApiStub();
