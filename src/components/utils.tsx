import React, { PureComponent } from 'react';
import { Tooltip, Icon, Container } from '@grafana/ui';

interface FormLabelProps {
  name: string;
  help: string;
}

interface FormLabelState {}

export class FormLabel extends PureComponent<FormLabelProps, FormLabelState> {
  render() {
    return (
      <Container margin="sm">
        {this.props.name}
        <Tooltip content={this.props.help}>
          <span>
            &nbsp;
            <Icon name="question-circle" />
          </span>
        </Tooltip>
      </Container>
    );
  }
}
