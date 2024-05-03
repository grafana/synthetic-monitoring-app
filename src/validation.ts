import * as punycode from 'punycode';
import { Address4, Address6 } from 'ip-address';

import { CheckType, Label } from 'types';

export const CheckValidation = {
  target: validateTarget,
  timeout: validateTimeout,
  labels: validateLabels,
};

export function validateTarget(typeOfCheck: CheckType, target: string): string | undefined {
  if (target.length > 2040) {
    return 'Target length must be less than 2040 characters';
  }

  switch (typeOfCheck) {
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
    case CheckType.Scripted: {
      if (target.length < 3) {
        return 'Instance must be at least 3 characters long';
      }
      return undefined;
    }
    case CheckType.GRPC: {
      return validateHostPort(target);
    }
    default: {
      // we want to make sure that we are validating the target for all
      // check types; if someone adds a check type but forgets to update
      // this validation, it will land here.
      return 'Invalid check type';
    }
  }
}

export function validateTimeout(timeout: number, maxTimeout: number, minTimeout: number): string | undefined {
  if (timeout > maxTimeout) {
    return `Timeout cannot be more than ${maxTimeout} seconds`;
  }
  if (timeout < minTimeout) {
    return `Timeout must be at least ${minTimeout} seconds`;
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

export function validateHostname(target: string): string | undefined {
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
