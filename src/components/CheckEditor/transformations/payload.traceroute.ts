import { CheckFormValuesTraceroute, TracerouteCheck, TracerouteSettings, TracerouteSettingsFormValues } from 'types';
import { getBasePayloadValuesFromForm } from 'components/CheckEditor/transformations/payload.utils';
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
    maxHops: parseInt(String(updatedSettings.maxHops), 10),
    ptrLookup: updatedSettings.ptrLookup,
    maxUnknownHops: parseInt(String(updatedSettings.maxUnknownHops), 10),
    hopTimeout: updatedSettings.hopTimeout,
  };
};
