import { Check, CheckType, Settings, HttpSettings, PingSettings, DnsSettings, TcpSettings, Label } from 'types';
import { checkType } from 'utils';
import * as punycode from 'punycode';
import { Address4, Address6 } from 'ip-address';

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
  return (
    CheckValidation.job(check.job) &&
    CheckValidation.target(checkType(check.settings), check.target) &&
    CheckValidation.frequency(check.frequency) &&
    CheckValidation.timeout(check.timeout) &&
    CheckValidation.labels(check.labels) &&
    CheckValidation.settings(check.settings) &&
    CheckValidation.probes(check.probes)
  );
}

export function validateJob(job: string): boolean {
  return job.length > 0 && job.length <= 32;
}

export function validateTarget(typeOfCheck: CheckType, target: string): boolean {
  if (!(target.length > 0 && target.length <= 64)) {
    return false;
  }

  switch (typeOfCheck) {
    case CheckType.HTTP: {
      return validateHttpTarget(target);
    }
    case CheckType.PING: {
      return validateHostname(target);
    }
    case CheckType.DNS: {
      return validateHostname(target);
    }
    case CheckType.TCP: {
      return validateHostPort(target);
    }
    default: {
      // we want to make sure that we are validating the target for all
      // check types; if someone adds a check type but forgets to update
      // this validation, it will land here.
      return false;
    }
  }
}

export function validateFrequency(freq: number): boolean {
  return freq >= 10000 && freq <= 120000;
}

export function validateTimeout(t: number): boolean {
  return t >= 1000 && t <= 10000;
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

export function validateLabel(label: Label): boolean {
  return validateLabelName(label.name) && validateLabelValue(label.value);
}

export function validateLabelName(name: string): boolean {
  if (name.length < 1 || name.length > 32) {
    return false;
  }

  return labelRegex.test(name);
}

export function validateLabelValue(value: string): boolean {
  return value.length > 0 && value.length <= 32;
}

export function validateSettings(settings: Settings): boolean {
  let checkT = checkType(settings);
  if (!settings[checkT]) {
    return false;
  }

  switch (checkT) {
    case CheckType.HTTP: {
      return validateSettingsHTTP(settings.http!);
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
  }
}

export function validateProbes(probes: number[]): boolean {
  return probes.length > 0 && probes.length <= 64;
}

export function validateSettingsHTTP(settings: HttpSettings): boolean {
  return true;
}

export function validateSettingsPING(settings: PingSettings): boolean {
  return true;
}

export function validateSettingsDNS(settings: DnsSettings): boolean {
  return true;
}

export function validateSettingsTCP(settings: TcpSettings): boolean {
  return true;
}

function validateHttpTarget(target: string): boolean {
  try {
    let url = new URL(target);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch (_) {
    return false;
  }
}

function validateHostname(target: string): boolean {
  // guess IP address first because some invalid IP addresses will look
  // like valid hostnames

  const ipv4 = new Address4(target);
  if (ipv4.isValid()) {
    return true;
  }

  const ipv6 = new Address6(target);
  if (ipv6.isValid()) {
    return true;
  }

  // it doesn't seem to be an IP address, let's try FQHN.
  const pc = punycode.toASCII(target);
  // note that \w matches "_"
  const re = new RegExp(/^[a-z]([-a-z0-9]{0,62}[a-z0-9])?(\.[a-z]([-a-z0-9]{0,62}[a-z0-9])?)+$/, 'i');

  return pc.match(re) != null;
}

function validateHostPort(target: string): boolean {
  const re = new RegExp(/^(?:\[([0-9a-f:.]+)\]|([^:]+)):(\d+)$/, 'i');
  const match = target.match(re);

  if (match === null) {
    return false;
  }

  const host = match[1] !== undefined ? match[1] : match[2];
  const port = parseInt(match[3], 10);

  return validateHostname(host) && !isNaN(port) && port > 0 && port <= 65535;
}
