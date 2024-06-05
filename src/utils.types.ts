import {
  Check,
  CheckFormValues,
  CheckFormValuesGRPC,
  CheckFormValuesHttp,
  CheckFormValuesMultiHttp,
  CheckFormValuesTcp,
  DNSCheck,
  GRPCCheck,
  HTTPCheck,
  MultiHTTPCheck,
  PingCheck,
  ScriptedCheck,
  TCPCheck,
  TracerouteCheck,
} from 'types';

export function isDNSCheck(check: Partial<Check>): check is DNSCheck {
  if (Object.hasOwnProperty.call(check.settings, 'dns')) {
    return true;
  }

  return false;
}

export function isGRPCCheck(check: Partial<Check>): check is GRPCCheck {
  return 'grpc' in (check.settings ?? {});
}

export function isHttpCheck(check: Partial<Check>): check is HTTPCheck {
  if (Object.hasOwnProperty.call(check.settings, 'http')) {
    return true;
  }

  return false;
}

export function isMultiHttpCheck(check: Partial<Check>): check is MultiHTTPCheck {
  if (Object.hasOwnProperty.call(check.settings, 'multihttp')) {
    return true;
  }

  return false;
}

export function isPingCheck(check: Partial<Check>): check is PingCheck {
  if (Object.hasOwnProperty.call(check.settings, 'ping')) {
    return true;
  }

  return false;
}

export function isScriptedCheck(check: Partial<Check>): check is ScriptedCheck {
  if (Object.hasOwnProperty.call(check.settings, 'scripted')) {
    return true;
  }

  return false;
}

export function isTCPCheck(check: Partial<Check>): check is TCPCheck {
  if (Object.hasOwnProperty.call(check.settings, 'tcp')) {
    return true;
  }

  return false;
}

export function isTracerouteCheck(check: Partial<Check>): check is TracerouteCheck {
  if (Object.hasOwnProperty.call(check.settings, 'traceroute')) {
    return true;
  }

  return false;
}

export function isDNSSettings(settings: Check['settings']): settings is DNSCheck['settings'] {
  if (Object.hasOwnProperty.call(settings, 'dns')) {
    return true;
  }

  return false;
}

export function isHttpSettings(settings: Check['settings']): settings is HTTPCheck['settings'] {
  if (Object.hasOwnProperty.call(settings, 'http')) {
    return true;
  }

  return false;
}

export function isGRPCSettings(settings: Check['settings']): settings is GRPCCheck['settings'] {
  if (Object.hasOwnProperty.call(settings, 'grpc')) {
    return true;
  }

  return false;
}

export function isMultiHttpSettings(settings: Check['settings']): settings is MultiHTTPCheck['settings'] {
  if (Object.hasOwnProperty.call(settings, 'multihttp')) {
    return true;
  }

  return false;
}

export function isPingSettings(settings: Check['settings']): settings is PingCheck['settings'] {
  if (Object.hasOwnProperty.call(settings, 'ping')) {
    return true;
  }

  return false;
}

export function isScriptedSettings(settings: Check['settings']): settings is ScriptedCheck['settings'] {
  if (Object.hasOwnProperty.call(settings, 'scripted')) {
    return true;
  }

  return false;
}

export function isTCPSettings(settings: Check['settings']): settings is TCPCheck['settings'] {
  if (Object.hasOwnProperty.call(settings, 'tcp')) {
    return true;
  }

  return false;
}

export function isTracerouteSettings(settings: Check['settings']): settings is TracerouteCheck['settings'] {
  if (Object.hasOwnProperty.call(settings, 'traceroute')) {
    return true;
  }

  return false;
}

export function isGRPCFormValuesSettings(
  settings: CheckFormValues['settings']
): settings is CheckFormValuesGRPC['settings'] {
  if (Object.hasOwnProperty.call(settings, 'grpc')) {
    return true;
  }

  return false;
}

export function isHttpFormValuesSettings(
  settings: CheckFormValues['settings']
): settings is CheckFormValuesHttp['settings'] {
  if (Object.hasOwnProperty.call(settings, 'http')) {
    return true;
  }

  return false;
}

export function isMultiHttpFormValuesSettings(
  settings: CheckFormValues['settings']
): settings is CheckFormValuesMultiHttp['settings'] {
  if (Object.hasOwnProperty.call(settings, 'multihttp')) {
    return true;
  }

  return false;
}

export function isTCPFormValuesSettings(
  settings: CheckFormValues['settings']
): settings is CheckFormValuesTcp['settings'] {
  if (Object.hasOwnProperty.call(settings, 'tcp')) {
    return true;
  }

  return false;
}
