import React, { FC, useCallback, useMemo } from 'react';
import { DNSRRValidator } from 'types';
import ListInput from './ListInput';

interface Props {
  validations: DNSRRValidator | undefined;
  name: string;
  description: string;
  isEditor: boolean;
  onChange: (validations: DNSRRValidator | undefined) => void;
}

const DnsValidatorForm: FC<Props> = ({ onChange, validations, isEditor, name, description }) => {
  const failIfMatchesRegexp = useMemo(() => validations?.failIfMatchesRegexp ?? [], [validations]);
  const failIfNotMatchesRegexp = useMemo(() => validations?.failIfNotMatchesRegexp ?? [], [validations]);

  const onFailIfMatchesUpdate = useCallback(
    (failIfMatches: string[]) => {
      onChange({
        failIfMatchesRegexp: failIfMatches,
        failIfNotMatchesRegexp,
      });
    },
    [onChange, failIfNotMatchesRegexp]
  );

  const onFailIfNotMatchesUpdate = useCallback(
    (failIfNotMatches: string[]) => {
      onChange({
        failIfNotMatchesRegexp: failIfNotMatches,
        failIfMatchesRegexp,
      });
    },
    [onChange, failIfMatchesRegexp]
  );

  const dataTestId = name.replace(' ', '-').toLowerCase();
  return (
    <>
      <ListInput
        dataTestId={`${dataTestId}-matches`}
        label={`${name} matches`}
        description={`${description} match`}
        placeholder="Enter regexp"
        items={failIfMatchesRegexp}
        onUpdate={onFailIfMatchesUpdate}
        disabled={!isEditor}
      />
      <ListInput
        dataTestId={`${dataTestId}-not-matches`}
        label={`${name} doesn't match`}
        description={`${description} don't match`}
        placeholder="Enter regexp"
        items={failIfNotMatchesRegexp}
        onUpdate={onFailIfNotMatchesUpdate}
        disabled={!isEditor}
      />
    </>
  );
};

export default DnsValidatorForm;
