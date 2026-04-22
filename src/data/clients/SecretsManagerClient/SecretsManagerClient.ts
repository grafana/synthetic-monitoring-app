import { BackendSrvRequest, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { SecretResponseItem, SecretsListResponse } from './SecretsManagerClient.types';
import { SecretWithMetadata } from 'page/ConfigPageLayout/tabs/SecretsManagementTab';
import { SecretFormValues } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

import { SECRETS_API_BASE, SM_SECRET_DECRYPTER } from './constants';
import {
  CreateSecretFormValues,
  formValuesToCreatePayload,
  formValuesToUpdatePayload,
  normalizeSecret,
} from './SecretsManagerClient.utils';

/**
 * Client for Grafana's secrets management API
 * (`apis/secret.grafana.app/v1beta1/...`). Handles Kubernetes-style request
 * and response shapes and normalizes results into `SecretWithMetadata` for
 * consumers.
 *
 * The list call is scoped to secrets whose decrypters include
 * `synthetic-monitoring` via a server-side `fieldSelector`. Individual reads
 * (`fetchSecret`) do not apply that scope.
 */
export class SecretsManagerClient {
  private readonly basePath: string;

  constructor(stackId: number) {
    this.basePath = `${SECRETS_API_BASE}/namespaces/stacks-${stackId}/securevalues`;
  }

  private async request<T>(options: Omit<BackendSrvRequest, 'url'> & { url: string }): Promise<T> {
    const response = await firstValueFrom(
      getBackendSrv().fetch<T>({
        showErrorAlert: false,
        showSuccessAlert: false,
        ...options,
      })
    );
    return response?.data as T;
  }

  async fetchAll(): Promise<SecretWithMetadata[]> {
    const response = await this.request<SecretsListResponse>({
      method: 'GET',
      url: this.basePath,
      params: { fieldSelector: `spec.decrypter=${SM_SECRET_DECRYPTER}` },
    });

    const items = response?.items ?? [];
    return items.map(normalizeSecret);
  }

  async fetchSecret(name: string): Promise<SecretWithMetadata> {
    const response = await this.request<SecretResponseItem>({
      method: 'GET',
      url: `${this.basePath}/${name}`,
    });
    return normalizeSecret(response);
  }

  async createSecret(values: CreateSecretFormValues): Promise<SecretWithMetadata> {
    const payload = formValuesToCreatePayload(values);
    const response = await this.request<SecretResponseItem>({
      method: 'POST',
      url: this.basePath,
      data: payload,
    });
    return normalizeSecret(response);
  }

  async updateSecret(values: SecretFormValues, currentDecrypters: string[]): Promise<SecretWithMetadata> {
    const payload = formValuesToUpdatePayload(values, currentDecrypters);
    const response = await this.request<SecretResponseItem>({
      method: 'PUT',
      url: `${this.basePath}/${values.name}`,
      data: payload,
    });
    return normalizeSecret(response);
  }

  async deleteSecret(name: string): Promise<void> {
    await this.request<unknown>({
      method: 'DELETE',
      url: `${this.basePath}/${name}`,
    });
  }
}
