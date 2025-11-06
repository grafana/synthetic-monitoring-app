import { FeatureTabConfig } from '../types';
import { FeatureName } from 'types';
import {
  API_ENDPOINT_DOCS_CHECK_COMPATABILITY,
  DocsPanelAPIEndpoint,
} from 'components/Checkster/feature/docs/DocsPanelAPIEndpoint';
import {
  DocsPanelMultiStep,
  MULTI_STEP_DOCS_CHECK_COMPATABILITY,
} from 'components/Checkster/feature/docs/DocsPanelMultiStep';

import { BROWSER_CHECK_DOCS_CHECK_COMPATABILITY, DocsPanelBrowserCheck } from './docs/DocsPanelBrowser';
import { DocsPanelScriptedCheck, SCRIPTED_DOCS_CHECK_COMPATABILITY } from './docs/DocsPanelScripted';
import { ADHOC_CHECK_COMPATABILITY, AdhocCheckPanel } from './adhoc-check';
import { SECRETS_CHECK_COMPATIBILITY, SecretsPanel } from './secrets';

export const FEATURE_TABS: FeatureTabConfig[] = [
  ['Test', AdhocCheckPanel, ADHOC_CHECK_COMPATABILITY],
  ['Secrets', SecretsPanel, SECRETS_CHECK_COMPATIBILITY, FeatureName.SecretsManagement],
  ['Docs', DocsPanelAPIEndpoint, API_ENDPOINT_DOCS_CHECK_COMPATABILITY],
  ['Docs', DocsPanelBrowserCheck, BROWSER_CHECK_DOCS_CHECK_COMPATABILITY],
  ['Docs', DocsPanelScriptedCheck, SCRIPTED_DOCS_CHECK_COMPATABILITY],
  ['Docs', DocsPanelMultiStep, MULTI_STEP_DOCS_CHECK_COMPATABILITY],
];
