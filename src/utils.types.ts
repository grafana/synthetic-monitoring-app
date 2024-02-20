import {
  Check,
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

export function isHttpCheck(check: Partial<Check>): check is HTTPCheck {
  if (Object.hasOwnProperty.call(check.settings, 'http')) {
    return true;
  }

  return false;
}

export function isScriptedCheck(check: Partial<Check>): check is ScriptedCheck {
  if (Object.hasOwnProperty.call(check.settings, 'k6')) {
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

export function isHttpSettings(settings: Check['settings']): settings is HTTPCheck['settings'] {
  if (Object.hasOwnProperty.call(settings, 'http')) {
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
