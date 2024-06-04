import { CheckFormValuesTraceroute, TracerouteCheck, TracerouteSettings, TracerouteSettingsFormValues } from 'types';
import { getBasePayloadValuesFromForm } from 'components/CheckEditor/transformations/toPayload.utils';
import { FALLBACK_CHECK_TRACEROUTE } from 'components/constants';

export function getTraceroutePayload(formValues: CheckFormValuesTraceroute): TracerouteCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      traceroute: getTracerouteSettings(formValues.settings.traceroute),
    },
  };
}

const getTracerouteSettings = (settings: TracerouteSettingsFormValues | undefined): TracerouteSettings => {
  const fallbackValues = FALLBACK_CHECK_TRACEROUTE.settings.traceroute;
  const updatedSettings = settings ?? fallbackValues;

  return {
    maxHops: updatedSettings.maxHops,
    ptrLookup: updatedSettings.ptrLookup,
    maxUnknownHops: updatedSettings.maxUnknownHops,
    hopTimeout: updatedSettings.hopTimeout,
  };
};
