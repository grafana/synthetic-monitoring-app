import React, { FC } from 'react';
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
  const failIfMatchesRegexp = validations?.failIfMatchesRegexp ?? [];
  const failIfNotMatchesRegexp = validations?.failIfNotMatchesRegexp ?? [];

  const dataTestId = name.replace(' ', '-').toLowerCase();
  return (
    <>
      <ListInput
        dataTestId={`${dataTestId}-matches`}
        label={`${name} matches`}
        description={`${description} match`}
        placeholder="Enter regexp"
        items={failIfMatchesRegexp}
        onUpdate={(failIfMatches: string[]) => {
          onChange({
            failIfMatchesRegexp: failIfMatches,
            failIfNotMatchesRegexp,
          });
        }}
        disabled={!isEditor}
      />
      <ListInput
        dataTestId={`${dataTestId}-not-matches`}
        label={`${name} doesn't match`}
        description={`${description} don't match`}
        placeholder="Enter regexp"
        items={failIfNotMatchesRegexp}
        onUpdate={(failIfNotMatches: string[]) => {
          onChange({
            failIfNotMatchesRegexp: failIfNotMatches,
            failIfMatchesRegexp,
          });
        }}
        disabled={!isEditor}
      />
    </>
  );
};

export default DnsValidatorForm;
