import React from 'react';
import { useFormContext } from 'react-hook-form';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesTraceroute, CheckType } from 'types';
import { useNestedRequestErrors } from 'hooks/useNestedRequestErrors';
import { TracerouteRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';
import { TracerouteRequest } from 'components/CheckEditor/FormComponents/TracerouteRequest';

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
  const {
    formState: { disabled: isFormDisabled },
  } = useFormContext();
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
        <Timeout checkType={CheckType.Traceroute} />
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
