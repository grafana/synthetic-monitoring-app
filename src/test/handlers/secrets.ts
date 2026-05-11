import { ApiEntry } from './types';
import {
  SecretResponseItem,
  SecretsListResponse,
} from 'data/clients/SecretsManagerClient/SecretsManagerClient.types';

import { MOCKED_SECURE_VALUE_ITEMS, MOCKED_SECURE_VALUES_API_RESPONSE } from '../fixtures/secrets';

const LIST_ROUTE = `/apis/secret.grafana.app/v1beta1/namespaces/stacks-[^/]+/securevalues`;
const ITEM_ROUTE = `/apis/secret.grafana.app/v1beta1/namespaces/stacks-[^/]+/securevalues/([^/]+)`;

/**
 * Handler for `GET .../securevalues`.
 *
 * Returns a Kubernetes-style `SecureValueList`. The real API filters the
 * list by `fieldSelector=spec.decrypter=<name>`; this mock handler does not
 * honor the fieldSelector, so tests should set up fixtures that already
 * represent the filtered server-side result.
 */
export const listSecrets: ApiEntry<SecretsListResponse> = {
  route: LIST_ROUTE,
  method: `get`,
  result: () => {
    return {
      json: MOCKED_SECURE_VALUES_API_RESPONSE,
    };
  },
};

/**
 * Handler for `GET .../securevalues/{name}`.
 */
export const getSecret: ApiEntry<SecretResponseItem> = {
  route: ITEM_ROUTE,
  method: `get`,
  result: () => {
    return {
      json: MOCKED_SECURE_VALUE_ITEMS[0],
    };
  },
};

/**
 * Handler for `POST .../securevalues` (create).
 *
 * Returns the first fixture item as a stand-in for the newly created resource.
 */
export const createSecret: ApiEntry<SecretResponseItem> = {
  route: LIST_ROUTE,
  method: `post`,
  result: () => {
    return {
      json: MOCKED_SECURE_VALUE_ITEMS[0],
    };
  },
};

/**
 * Handler for `PUT .../securevalues/{name}` (update).
 *
 * Returns the first fixture item as a stand-in for the updated resource.
 */
export const updateSecret: ApiEntry<SecretResponseItem> = {
  route: ITEM_ROUTE,
  method: `put`,
  result: () => {
    return {
      json: MOCKED_SECURE_VALUE_ITEMS[0],
    };
  },
};

/**
 * Handler for `DELETE .../securevalues/{name}` (delete).
 */
export const deleteSecret: ApiEntry<unknown> = {
  route: ITEM_ROUTE,
  method: `delete`,
  result: () => {
    return {
      json: null,
    };
  },
};
