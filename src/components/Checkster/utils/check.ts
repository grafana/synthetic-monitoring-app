import { CheckInstrumentation } from '../types';
import {
  BrowserCheck,
  Check,
  CheckType,
  CheckTypeGroup,
  DNSCheck,
  GRPCCheck,
  HTTPCheck,
  MultiHTTPCheck,
  PingCheck,
  ScriptedCheck,
  TCPCheck,
  TracerouteCheck,
} from 'types';

import { isFeatureEnabled } from '../../../contexts/FeatureFlagContext';
import {
  CHECK_TYPE_GROUP_MAP,
  CHECK_TYPE_GROUP_OPTIONS_MAP,
  CHECK_TYPE_OPTION_MAP,
  DEFAULT_CHECK_CONFIG,
  DEFAULT_CHECK_CONFIG_MAP,
  DEFAULT_CHECK_TYPE,
} from '../constants';

export function isCheckTypeEnabled(type: CheckType) {}

export function isCheckTypeGroupEnabled(group: CheckTypeGroup) {}

// Returns true if the provided value is a Check
// Existing checks do not have to be checked against feature flags as they were already created
export function isCheck(check: unknown): check is Check {
  const checkTypes = Object.values(CheckType);
  if (!check || typeof check !== 'object' || !('settings' in check)) {
    return false;
  }

  const [settingsType] = Object.keys((check as Check).settings ?? {});
  return checkTypes.includes(settingsType as CheckType);
}

// Returns true if the provided value is a CheckInstrumentation
// New checks have to be checked against feature flags as some check types or groups may be disabled
export function isCheckInstrumentation(subject: unknown): subject is CheckInstrumentation {
  if (!subject || typeof subject !== 'object') {
    return false;
  }

  if ('group' in subject && CHECK_TYPE_GROUP_OPTIONS_MAP[subject.group as CheckTypeGroup]) {
    const group = CHECK_TYPE_GROUP_OPTIONS_MAP[subject.group as CheckTypeGroup];
    return !group.featureToggle || isFeatureEnabled(group.featureToggle);
  }

  if ('type' in subject && CHECK_TYPE_OPTION_MAP[subject.type as CheckType]) {
    const type = CHECK_TYPE_OPTION_MAP[subject.type as CheckType];
    const group = CHECK_TYPE_GROUP_OPTIONS_MAP[type.group];

    // Check if the type belongs to a group that requires a feature flag
    if (group.featureToggle && !isFeatureEnabled(group.featureToggle)) {
      return false;
    }

    return !type.featureToggle || isFeatureEnabled(type.featureToggle);
  }

  return false;
}

export function isCheckOfType(type: CheckType, check: Partial<Check>): check is Check {
  return type in (check.settings ?? {});
}

export function isDnsCheck(check: Partial<Check>): check is DNSCheck {
  return isCheckOfType(CheckType.DNS, check);
}

export function isGrpcCheck(check: Partial<Check>): check is GRPCCheck {
  return isCheckOfType(CheckType.GRPC, check);
}

export function isHttpCheck(check: Partial<Check>): check is HTTPCheck {
  return isCheckOfType(CheckType.HTTP, check);
}
export function isMultiHttpCheck(check: Partial<Check>): check is MultiHTTPCheck {
  return isCheckOfType(CheckType.MULTI_HTTP, check);
}

export function isPingCheck(check: Partial<Check>): check is PingCheck {
  return isCheckOfType(CheckType.PING, check);
}

export function isScriptedCheck(check: Partial<Check>): check is ScriptedCheck {
  return isCheckOfType(CheckType.Scripted, check);
}

export function isTcpCheck(check: Partial<Check>): check is TCPCheck {
  return isCheckOfType(CheckType.TCP, check);
}

export function isTracerouteCheck(check: Partial<Check>): check is TracerouteCheck {
  return isCheckOfType(CheckType.Traceroute, check);
}

export function isBrowserCheck(check: Partial<Check>): check is BrowserCheck {
  return isCheckOfType(CheckType.Browser, check);
}

// TODO: Revisit if CHECKSTER need to care about group types?
export function createInstrumentedCheck({ type, group }: CheckInstrumentation) {
  if (type) {
    return createCheck(type);
  }
  // Fallback to default check type for the group or default to DEFAULT_CHECK_TYPE
  const [defaultType] = group && CHECK_TYPE_GROUP_MAP[group] ? CHECK_TYPE_GROUP_MAP[group] : [DEFAULT_CHECK_TYPE];

  return createCheck(defaultType);
}

export function createCheck(checkType: CheckType = CheckType.HTTP) {
  return DEFAULT_CHECK_CONFIG_MAP[checkType] ?? DEFAULT_CHECK_CONFIG;
}

// Returns the CheckType of a Check, or DEFAULT_CHECK_TYPE check is undefined (or invalid)
export function getCheckType(check?: Check) {
  if (!check) {
    return DEFAULT_CHECK_TYPE;
  }

  const [checkType = DEFAULT_CHECK_TYPE] = Object.keys(check.settings ?? {});

  return checkType as CheckType;
}

export function getCheckTypeOption(checkType?: CheckType) {
  return CHECK_TYPE_OPTION_MAP[checkType ?? DEFAULT_CHECK_TYPE] ?? CHECK_TYPE_OPTION_MAP[DEFAULT_CHECK_TYPE];
}
