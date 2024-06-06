import { CheckFormValuesTraceroute, CheckType, TracerouteCheck, TracerouteSettingsFormValues } from 'types';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/toFormValues.utils';
import { FALLBACK_CHECK_TRACEROUTE } from 'components/constants';

export function getTracerouteCheckFormValues(check: TracerouteCheck): CheckFormValuesTraceroute {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.Traceroute,
    settings: {
      traceroute: getTracerouteSettingsFormValues(check.settings),
    },
  };
}

const getTracerouteSettingsFormValues = (settings: TracerouteCheck['settings']): TracerouteSettingsFormValues => {
  const tracerouteSettings = settings.traceroute ?? FALLBACK_CHECK_TRACEROUTE.settings.traceroute;

  return {
    maxHops: tracerouteSettings.maxHops,
    ptrLookup: tracerouteSettings.ptrLookup,
    maxUnknownHops: tracerouteSettings.maxUnknownHops,
    hopTimeout: tracerouteSettings.hopTimeout,
  };
};
