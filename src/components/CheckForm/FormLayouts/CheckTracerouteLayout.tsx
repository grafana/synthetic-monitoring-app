import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesTraceroute } from 'types';
import { useNestedRequestErrors } from 'hooks/useNestedRequestErrors';
import { TracerouteRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';
import { TracerouteRequest } from 'components/CheckEditor/FormComponents/TracerouteRequest';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';

const TRACEROUTE_FIELDS: TracerouteRequestFields = {
  target: {
    name: `target`,
  },
  maxHops: {
    name: `settings.traceroute.maxHops`,
    section: 0,
  },
  maxUnknownHops: {
    name: `settings.traceroute.maxUnknownHops`,
    section: 0,
  },
  ptrLookup: {
    name: `settings.traceroute.ptrLookup`,
    section: 0,
  },
};

const CheckTracerouteRequest = () => {
  const { isFormDisabled } = useCheckFormContext();
  const { handleErrorRef } = useNestedRequestErrors(TRACEROUTE_FIELDS);

  return <TracerouteRequest disabled={isFormDisabled} fields={TRACEROUTE_FIELDS} ref={handleErrorRef} />;
};
export const TracerouteCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesTraceroute>>> = {
  [LayoutSection.Check]: {
    fields: Object.values(TRACEROUTE_FIELDS).map((field) => field.name),
    Component: (
      <div>
        <CheckTracerouteRequest />
      </div>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`timeout`],
    Component: (
      <>
        <Timeout max={30.0} min={30.0} />
      </>
    ),
  },
  [LayoutSection.Probes]: {
    fields: [`publishAdvancedMetrics`],
    Component: (
      <>
        <CheckPublishedAdvanceMetrics />
      </>
    ),
  },
};
