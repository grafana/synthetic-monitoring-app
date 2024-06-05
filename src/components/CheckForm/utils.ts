import { capitalize } from 'lodash';

export function interpolateErrorMessage(message: string | undefined, label: string) {
  return message?.replace(`{type}`, capitalize(label));
}
