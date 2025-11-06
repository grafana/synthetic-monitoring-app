import { FeatureTabConfig } from '../types';
import { FeatureName } from 'types';
import {
  API_ENDPOINT_DOCS_CHECK_COMPATABILITY,
  APIEndpointDocsPanel,
} from 'components/Checkster/feature/docs/APIEndpointDocsPanel';

import { BROWSER_CHECK_DOCS_CHECK_COMPATABILITY, BrowserCheckDocsPanel } from './docs/BrowserCheckDocsPanel';
import { SCRIPTED_DOCS_CHECK_COMPATABILITY, ScriptedCheckDocsPanel } from './docs/ScriptedCheckDocsPanel';
import { ADHOC_CHECK_COMPATABILITY, AdhocCheckPanel } from './adhoc-check';
import { SECRETS_CHECK_COMPATIBILITY, SecretsPanel } from './secrets';

export const FEATURE_TABS: FeatureTabConfig[] = [
  ['Test', AdhocCheckPanel, ADHOC_CHECK_COMPATABILITY],
  ['Secrets', SecretsPanel, SECRETS_CHECK_COMPATIBILITY, FeatureName.SecretsManagement],
  ['Docs', APIEndpointDocsPanel, API_ENDPOINT_DOCS_CHECK_COMPATABILITY],
  ['Docs', BrowserCheckDocsPanel, BROWSER_CHECK_DOCS_CHECK_COMPATABILITY],
  ['Docs', ScriptedCheckDocsPanel, SCRIPTED_DOCS_CHECK_COMPATABILITY],
];
