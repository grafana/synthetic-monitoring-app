import React, { PureComponent } from 'react';
import { DNSRRValidator } from 'types';
import ListInput from './ListInput';

interface DnsValidatorProps {
  validations: DNSRRValidator | undefined;
  name: string;
  description: string;
  isEditor: boolean;
  onChange: (validations: DNSRRValidator | undefined) => void;
}

export default class DnsValidatorForm extends PureComponent<DnsValidatorProps> {
  onUpdateFailIfMatches = (failIfMatchesRegexp: string[]) => {
    const { onChange } = this.props;
    const { validations } = this.props;
    const failIfNotMatchesRegexp = validations?.failIfNotMatchesRegexp ?? [];
    onChange({
      failIfMatchesRegexp,
      failIfNotMatchesRegexp,
    });
  };

  onUpdateFailIfNotMatches = (failIfNotMatchesRegexp: string[]) => {
    const { onChange } = this.props;
    const { validations } = this.props;
    const failIfMatchesRegexp = validations?.failIfMatchesRegexp ?? [];
    onChange({
      failIfNotMatchesRegexp,
      failIfMatchesRegexp,
    });
  };

  render() {
    const { validations } = this.props;
    const failIfMatchesRegexp = validations?.failIfMatchesRegexp ?? [];
    const failIfNotMatchesRegexp = validations?.failIfNotMatchesRegexp ?? [];

    const { isEditor, name, description } = this.props;
    const dataTestId = name.replace(' ', '-').toLowerCase();
    return (
      <>
        <ListInput
          dataTestId={`${dataTestId}-matches`}
          label={`${name} matches`}
          description={`${description} match`}
          placeholder="Enter regexp"
          items={failIfMatchesRegexp}
          onUpdate={this.onUpdateFailIfMatches}
          disabled={!isEditor}
        />
        <ListInput
          dataTestId={`${dataTestId}-not-matches`}
          label={`${name} doesn't match`}
          description={`${description} don't match`}
          placeholder="Enter regexp"
          items={failIfNotMatchesRegexp}
          onUpdate={this.onUpdateFailIfNotMatches}
          disabled={!isEditor}
        />
      </>
    );
  }
}
