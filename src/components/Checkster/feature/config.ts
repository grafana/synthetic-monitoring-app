import { FeatureTabConfig } from '../types';
import { FeatureName } from 'types';

import { TerraformPanel } from './terraform/TerraformPanel';
import { ADHOC_CHECK_COMPATABILITY, AdhocCheckPanel } from './adhoc-check';
import { DOCS_CHECK_COMPATABILITY, DocsPanel } from './docs';
import { SECRETS_CHECK_COMPATIBILITY, SecretsPanel } from './secrets';

export const FEATURE_TABS: FeatureTabConfig[] = [
  ['Test', AdhocCheckPanel, ADHOC_CHECK_COMPATABILITY],
  ['Secrets', SecretsPanel, SECRETS_CHECK_COMPATIBILITY, FeatureName.SecretsManagement],
  ['Terraform', TerraformPanel, []],
  ['Docs', DocsPanel, DOCS_CHECK_COMPATABILITY],
];
