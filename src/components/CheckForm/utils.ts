import { capitalize } from 'lodash';

export function parseErrorMessage(message: string | undefined, label: string) {
  return message?.replace(`{type}`, capitalize(label));
}
