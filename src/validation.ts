import {
  Check,
  CheckType,
  Settings,
  HttpSettings,
  PingSettings,
  DnsSettings,
  TcpSettings,
  Label,
  TracerouteSettings,
  MultiHttpSettings,
} from 'types';
import { checkType } from 'utils';
import * as punycode from 'punycode';
import { Address4, Address6 } from 'ip-address';
import validUrl from 'valid-url';
import { PEM_HEADER, PEM_FOOTER, INVALID_WEB_URL_MESSAGE } from 'components/constants';

export const CheckValidation = {
  job: validateJob,
  target: validateTarget,
  frequency: validateFrequency,
  timeout: validateTimeout,
  labels: validateLabels,
  settings: validateSettings,
  probes: validateProbes,
};

export function validateCheck(check: Check): boolean {
  const type = checkType(check.settings);
  return Boolean(
    CheckValidation.job(check.job) &&
      CheckValidation.target(checkType(check.settings), check.target) &&
      CheckValidation.frequency(check.frequency, type) &&
      CheckValidation.timeout(check.timeout, type) &&
      CheckValidation.labels(check.labels) &&
      CheckValidation.settings(check.settings) &&
      CheckValidation.probes(check.probes)
  );
}

export function validateJob(job: string): string | undefined {
  if (job.length > 128) {
    return 'Job name must be 128 characters or less';
  }
  return undefined;
}

export function validateTarget(typeOfCheck: CheckType, target: string): string | undefined {
  if (target.length > 2040) {
    return 'Target length must be less than 2040 characters';
  }

  switch (typeOfCheck) {
    case CheckType.HTTP: {
      return validateHttpTarget(target);
    }
    case CheckType.MULTI_HTTP: {
      return validateHttpTarget(target);
    }
    case CheckType.PING: {
      return validateHostname(target);
    }
    case CheckType.DNS: {
      return validateDomain(target);
    }
    case CheckType.TCP: {
      return validateHostPort(target);
    }
    case CheckType.Traceroute: {
      return validateHostname(target);
    }
    default: {
      // we want to make sure that we are validating the target for all
      // check types; if someone adds a check type but forgets to update
      // this validation, it will land here.
      return 'Invalid check type';
    }
  }
}

export function validateFrequency(frequency: number, selectedCheckType: CheckType): string | undefined {
  switch (selectedCheckType) {
    case CheckType.Traceroute: {
      if (frequency < 120) {
        return `Frequency must be at least 120 seconds`;
      }
      if (frequency > 120) {
        return `Frequency cannot be greater than 120 seconds`;
      }
      break;
    }
    case CheckType.MULTI_HTTP: {
      if (frequency < 60) {
        return `Frequency must be at least 60 seconds`;
      }
      if (frequency > 120) {
        return `Frequency cannot be greater than 120 seconds`;
      }
      break;
    }
    default: {
      if (frequency < 10) {
        return `Frequency must be at least 10 seconds`;
      }
      if (frequency > 120) {
        return `Frequency cannot be greater than 120 seconds`;
      }
    }
  }
  return undefined;
}

export function validateTimeout(timeout: number, checkType: CheckType): string | undefined {
  switch (checkType) {
    case CheckType.Traceroute: {
      if (timeout < 30) {
        return 'Timeout must be at least 30 seconds';
      }
      if (timeout < 30) {
        return 'Timeout cannot be more than 30 seconds';
      }
      break;
    }
    case CheckType.MULTI_HTTP: {
      if (timeout < 1) {
        return 'Timeout must be at least 1 second';
      }
      if (timeout > 30) {
        return 'Timeout cannot be more than 30 seconds';
      }
      break;
    }
    default: {
      if (timeout < 1) {
        return 'Timeout must be at least 1 second';
      }
      if (timeout > 10) {
        return `Timeout cannot be greater than 10 seconds`;
      }
    }
  }

  return undefined;
}

export function validateLabels(labels: Label[]): boolean {
  if (labels.length < 0 || labels.length > 5) {
    return false;
  }
  // validate each label
  for (const l of labels) {
    if (!validateLabel(l)) {
      return false;
    }
  }
  return true;
}

const labelRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function validateLabel(label: Label): string | undefined {
  return validateLabelName(label.name, []) && validateLabelValue(label.value);
}

export function validateLabelName(name: string, labels: Label[]): string | undefined {
  const labelNames = new Set<string>();
  const duplicateLabels = new Set<string>();
  labels.forEach((label) => {
    if (labelNames.has(label.name)) {
      duplicateLabels.add(label.name);
    } else {
      labelNames.add(label.name);
    }
  });

  if (duplicateLabels.has(name)) {
    return 'Label names cannot be duplicated';
  }

  if (name.length > 128) {
    return 'Label names must be 128 characters or less';
  }
  if (!labelRegex.test(name)) {
    return 'Invalid label name';
  }

  return undefined;
}

export function validateLabelValue(value: string): string | undefined {
  if (value.length > 128) {
    return 'Label values must be 128 characters or less';
  }

  return undefined;
}

export function validateAnnotationName(name: string): string | undefined {
  if (name.length > 32) {
    return 'Label names must be 32 characters or less';
  }
  if (!labelRegex.test(name)) {
    return 'Invalid annotation name';
  }
  return undefined;
}

export const validateBasicAuthUsername = (username: string) => {
  return undefined;
};

export const validateBearerToken = (token: string) => {
  return undefined;
};

export const validateTLSServerName = (serverName: string) => {
  return undefined;
};

export const validateTLSCACert = (caCert?: string) => {
  if (!caCert) {
    return undefined;
  }
  if (caCert.indexOf(PEM_HEADER) < 0 || caCert.indexOf(PEM_FOOTER) < 0) {
    return 'Certificate must be in the PEM format.';
  }
  return undefined;
};

export const validateTLSClientCert = (clientCert?: string) => {
  if (!clientCert) {
    return undefined;
  }
  if (clientCert.indexOf(PEM_HEADER) < 0 || clientCert.indexOf(PEM_FOOTER) < 0) {
    return 'Certificate must be in the PEM format.';
  }
  return undefined;
};

export const validateTLSClientKey = (clientKey?: string) => {
  if (!clientKey) {
    return undefined;
  }
  if (clientKey.indexOf('-----BEGIN') < 0 || clientKey.indexOf('-----END') < 0) {
    return 'Key must be in the PEM format.';
  }
  return undefined;
};

export function validateSettings(settings: Settings): string | undefined {
  let checkT = checkType(settings);
  if (!settings[checkT]) {
    return 'Settings values required';
  }
  // WHAT IS THIS FUNCTION FOR??
  switch (checkT) {
    case CheckType.HTTP: {
      return validateSettingsHTTP(settings.http!);
    }
    case CheckType.MULTI_HTTP: {
      return validateSettingsMultiHTTP(settings.multihttp!);
    }
    case CheckType.PING: {
      return validateSettingsPING(settings.ping!);
    }
    case CheckType.DNS: {
      return validateSettingsDNS(settings.dns!);
    }
    case CheckType.TCP: {
      return validateSettingsTCP(settings.tcp!);
    }
    case CheckType.Traceroute: {
      return validateSettingsTraceroute(settings.traceroute);
    }
    case CheckType.K6: {
      return;
    }
  }
}

export function validateProbes(probes: number[]): string | undefined {
  if (probes.length === 0) {
    return 'Select a probe';
  }
  if (probes.length > 64) {
    return `The maximum probe quantity is 64, you have selected ${probes.length}`;
  }
  return undefined;
}

export const validateHTTPBody = (body: string) => {
  return undefined;
};

export const validateHTTPHeaderName = (name: string) => {
  return undefined;
};

export const validateHTTPHeaderValue = (name: string) => {
  return undefined;
};

export function validateSettingsTraceroute(settings?: TracerouteSettings): string | undefined {
  return undefined;
}

export function validateSettingsHTTP(settings: HttpSettings): string | undefined {
  return undefined;
}

export function validateSettingsMultiHTTP(settings: MultiHttpSettings): string | undefined {
  return undefined;
}

export function validateSettingsPING(settings: PingSettings): string | undefined {
  return undefined;
}

export function validateSettingsDNS(settings: DnsSettings): string | undefined {
  return undefined;
}

export function validateSettingsTCP(settings: TcpSettings): string | undefined {
  return undefined;
}

function validateHttpTarget(target: string): string | undefined {
  try {
    // valid url will fail if curly brackets are not URI encoded, but curly brackets are technically allowed and work in the real world.
    // We encode the target before checking to get around that
    // encodeURI can throw in certain circumstances, so we must wrap it in a try/catch
    const httpEncoded = encodeURI(target);
    const isValidUrl = Boolean(validUrl.isWebUri(httpEncoded));
    if (!isValidUrl) {
      return INVALID_WEB_URL_MESSAGE;
    }
  } catch (e) {
    return INVALID_WEB_URL_MESSAGE;
  }

  try {
    const parsedUrl = new URL(target);

    if (!parsedUrl.protocol) {
      return 'Target must have a valid protocol';
    }

    // isWebUri will allow some invalid hostnames, so we need addional validation
    const ipv6 = isIpV6FromUrl(target);
    if (ipv6) {
      return undefined;
    }

    const hostname = parsedUrl.hostname;
    if (validateHostname(hostname)) {
      return 'Target must have a valid hostname';
    }
    return undefined;
  } catch (e) {
    // The new URL constructor throws on invalid web URLs
    return INVALID_WEB_URL_MESSAGE;
  }
}

const isIpV4 = (target: string): boolean => {
  let isIpV4 = true;
  try {
    new Address4(target);
  } catch (e) {
    isIpV4 = false;
  }
  return isIpV4;
};

const isIpV6 = (target: string): boolean => {
  let isIpV6 = true;
  try {
    new Address6(target);
  } catch (e) {
    isIpV6 = false;
  }
  return isIpV6;
};

const isIpV6FromUrl = (target: string): boolean => {
  let isIpV6 = true;
  try {
    const address = Address6.fromURL(target);
    isIpV6 = Boolean(address.address);
  } catch (e) {
    isIpV6 = false;
  }
  return isIpV6;
};

function validateDomain(target: string): string | undefined {
  const isIpAddress = isIpV4(target) || isIpV6(target);

  if (isIpAddress) {
    return 'IP addresses are not valid DNS targets';
  }

  if (target.length === 0 || target.length > 255) {
    return 'Hostname must be between 0 and 255 characters';
  }

  const rawElements = target.split('.');

  if (rawElements.length < 2) {
    return 'Invalid number of elements in hostname';
  }

  const filteredElements = rawElements.filter((element, index) => {
    const isLast = index === rawElements.length - 1;
    if (isLast && element === '') {
      return false;
    }
    return true;
  });

  const errors = filteredElements
    .map((element, index) => {
      const isLast = index === filteredElements.length - 1;
      const error = validateDomainElement(element, isLast);
      if (error) {
        return error;
      }
      return undefined;
    })
    .filter(Boolean);

  return errors[0] ?? undefined;
}

function isCharacterNumber(character: string): boolean {
  const numberRegex = new RegExp(/[0-9]/);
  return Boolean(character.match(numberRegex)?.length);
}

function isCharacterLetter(character: string): boolean {
  const letterRegex = new RegExp(/[a-zA-Z]/);
  return Boolean(character.match(letterRegex)?.length);
}

function isValidDomainCharacter(character: string): boolean {
  const regex = new RegExp(/[-A-Za-z0-9\.]/);
  return Boolean(!character.match(regex)?.length);
}

function validateDomainElement(element: string, isLast: boolean): string | undefined {
  if ((!isLast && element.length === 0) || element.length > 63) {
    return 'Invalid domain element length. Each element must be between 1 and 62 characters';
  }

  // This is to allow trailing '.' characters in dns records
  if (isLast && element.length === 0) {
    return undefined;
  }

  const first = element[0];
  const last = element[element.length - 1];
  if (!isCharacterLetter(first) && !isCharacterNumber(first)) {
    return 'A domain element must begin with a letter or number';
  }

  if (!isCharacterNumber(last) && !isCharacterLetter(last)) {
    return 'A domain element must end with a letter or number';
  }

  if (isLast) {
    const hasNonNumbers = element.split('').some((character) => !isCharacterNumber(character));
    if (!hasNonNumbers) {
      return 'A domain TLD cannot contain only numbers';
    }
  }

  const hasInvalidCharacter = element.split('').some((character) => isValidDomainCharacter(character));
  if (hasInvalidCharacter) {
    return 'Invalid character in domain name. Only letters, numbers and "-" are allowed';
  }

  return undefined;
}

function validateHostname(target: string): string | undefined {
  const ipv4 = isIpV4(target);
  const ipv6 = isIpV6(target);
  const pc = punycode.toASCII(target);
  // note that \w matches "_"
  const re = new RegExp(
    /^[a-z0-9]([-a-z0-9]{0,62}[a-z0-9])?(\.[a-z0-9]([-a-z0-9]{0,62}[a-z0-9])?)*\.([a-z]|[a-z0-9]([-a-z0-9]{0,62}[a-z])|[a-z]([-a-z0-9]{0,62}[a-z0-9])?)$/,
    'i'
  );
  if (!pc.match(re) && !ipv4 && !ipv6) {
    return 'Target must be a valid hostname';
  }

  return undefined;
}

function validateHostPort(target: string): string | undefined {
  const re = new RegExp(/^(?:\[([0-9a-f:.]+)\]|([^:]+)):(\d+)$/, 'i');
  const match = target.match(re);

  if (match === null) {
    return 'Must be a valid host:port combination';
  }

  const host = match[1] !== undefined ? match[1] : match[2];
  const port = parseInt(match[match.length - 1], 10);

  if (isNaN(port)) {
    return 'Invalid port value';
  }
  if (port > 65535) {
    return 'Port must be less than 65535';
  }

  if (port <= 0) {
    return 'Port must be greater than 0';
  }

  return validateHostname(host);
}
