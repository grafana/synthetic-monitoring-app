import { Check, DNSCheck, HTTPCheck, MultiHTTPCheck, PingCheck, ScriptedCheck, TCPCheck, TracerouteCheck } from 'types';

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
