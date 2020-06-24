import { Check, CheckType, Settings, HttpSettings, PingSettings, DnsSettings, TcpSettings, Label } from 'types';
import { checkType } from 'utils';

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
    default: {
      return true;
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
