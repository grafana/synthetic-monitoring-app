import { ApiEntry } from './types';
import { SecretsResponse } from 'data/useSecrets';
import { SecretWithMetadata } from 'page/ConfigPageLayout/tabs/SecretsManagementTab';
import { SecretFormValues } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

import { MOCKED_SECRETS_API_RESPONSE } from '../fixtures/secrets';

/**
 * Represents an API entry for retrieving a list of secrets.
 *
 * The `listSecrets` variable is an instance of `ApiEntry` that defines the
 * necessary details for making a GET request to the `/api/v1alpha1/secrets`
 * endpoint. It retrieves secret data in the form of a `SecretsResponse`.
 *
 * Properties:
 * - `route`: Specifies the API's URL endpoint as a string (`/api/v1alpha1/secrets`).
 * - `method`: Defines the HTTP method (`get`) to be used for this API request.
 * - `result`: A function that simulates the server's response by returning
 *   mocked data (`MOCKED_SECRETS_API_RESPONSE`) as JSON.
 *
 * This API is generally used to query secrets information in a predefined format.
 */
export const listSecrets: ApiEntry<SecretsResponse> = {
  route: `/api/v1alpha1/secrets`,
  method: `get`,
  result: () => {
    return {
      json: MOCKED_SECRETS_API_RESPONSE,
    };
  },
};

/**
 * Represents an API entry for retrieving a secret along with its metadata.
 *
 * The `getSecret` object defines the route and method to retrieve a secret
 * and provides a mechanism for simulating a response with mock data.
 * It uses the `ApiEntry` type with the `SecretWithMetadata` structure to
 * ensure the returned data adheres to the expected format.
 *
 * Properties:
 * - `route`: Specifies the API endpoint for fetching the secret. Includes a dynamic UUID value based on mocked data.
 * - `method`: HTTP method used to interact with the API (in this case, `GET`).
 * - `result`: A function representing the response handler, returning a mock JSON payload containing the secret data.
 */
export const getSecret: ApiEntry<SecretWithMetadata> = {
  route: `/api/v1alpha1/secrets/${MOCKED_SECRETS_API_RESPONSE.secrets[0].uuid}`,
  method: `get`,
  result: () => {
    return {
      json: MOCKED_SECRETS_API_RESPONSE.secrets[0],
    };
  },
};

/**
 * An API entry configuration for creating a secret entity.
 *
 * This configuration includes the API route, HTTP method, and the expected result.
 *
 * Properties:
 * - `route`: The API endpoint for creating a new secret.
 * - `method`: The HTTP method used for the request, which is "post" in this case.
 * - `result`: A function that returns the expected result of the API call, which is a JSON response with a value of `null`.
 */
export const createSecret: ApiEntry<SecretFormValues> = {
  route: `/api/v1alpha1/secrets`,
  method: `post`,
  result: () => {
    return {
      json: null,
    };
  },
};

/**
 * Represents the API endpoint for updating a secret's details.
 *
 * This configuration includes the API route, HTTP method, and the expected result.
 *
 * Properties:
 * - `route`: The API endpoint for updating an existing secret.
 * - `method`: The HTTP method used for the request, which is "put" in this case.
 * - `result`: A function that returns the expected result of the API call, which is a JSON response with a value of `null`.
 */
export const updateSecret: ApiEntry<SecretFormValues> = {
  route: `/api/v1alpha1/secrets/${MOCKED_SECRETS_API_RESPONSE.secrets[0].uuid}`,
  method: `put`,
  result: () => {
    return {
      json: null,
    };
  },
};
