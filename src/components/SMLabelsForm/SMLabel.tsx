import React, { PureComponent } from 'react';
import { IconButton, HorizontalGroup, Input } from '@grafana/ui';
import { Label } from 'types';
import * as Validation from 'validation';

interface LabelProps {
  label: Label;
  index: number;
  isEditor: boolean;
  onDelete: (index: number) => void;
  onChange: (index: number, label: Label) => void;
}

interface LabelState {
  name: string;
  value: string;
}

export default class SMLabel extends PureComponent<LabelProps, LabelState> {
  state = {
    name: this.props.label.name,
    value: this.props.label.value,
  };

  componentDidUpdate(oldProps: LabelProps) {
    const { label, index } = this.props;
    if (label !== oldProps.label || index !== oldProps.index) {
      this.setState({ name: this.props.label.name, value: this.props.label.value });
    }
  }

  onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ name: event.target.value }, this.onChange);
  };

  onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ value: event.target.value }, this.onChange);
  };

  onDelete = () => {
    this.props.onDelete(this.props.index);
  };

  onChange = () => {
    this.props.onChange(this.props.index, { name: this.state.name, value: this.state.value });
  };

  render() {
    const { name, value } = this.state;
    const { isEditor } = this.props;
    console.log('rendering label with name:', name);
    return (
      <HorizontalGroup justify="space-between">
        <Input
          type="text"
          placeholder="name"
          value={name}
          onChange={this.onNameChange}
          disabled={!isEditor}
          invalid={!Validation.validateLabelName(name)}
        />
        <Input
          type="text"
          placeholder="value"
          value={value}
          onChange={this.onValueChange}
          disabled={!isEditor}
          invalid={!Validation.validateLabelValue(value)}
        />
        <IconButton name="minus-circle" onClick={this.onDelete} disabled={!isEditor} />
      </HorizontalGroup>
    );
  }
}
