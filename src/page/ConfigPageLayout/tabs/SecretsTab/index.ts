import { CreateSecret } from './CreatSecret';
import { EditSecret } from './EditSecret';
import { ListSecrets } from './ListSecrets';
import { SecretsTab as SecretsTabBase } from './SecretsTab';
import { ViewSecret } from './ViewSecret';

export const SecretsTab = Object.assign(SecretsTabBase, { ListSecrets, EditSecret, ViewSecret, CreateSecret });
