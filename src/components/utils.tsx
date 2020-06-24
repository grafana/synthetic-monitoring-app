import React, { PureComponent } from 'react';
import { Icon, IconButton, HorizontalGroup, List, Input, VerticalGroup, Button } from '@grafana/ui';
import { Label as WorldpingLabel, IpVersion } from 'types';
import * as Validation from 'validation';

interface LabelsProps {
  labels: WorldpingLabel[];
  isEditor: boolean;
  type: string;
  limit: number;
  onUpdate: (labels: WorldpingLabel[]) => void;
}

interface LabelsState {
  labels: WorldpingLabel[];
  numLabels: number;
}

export class WorldpingLabelsForm extends PureComponent<LabelsProps, LabelsState> {
  state = {
    labels: this.props.labels || [],
    numLabels: this.props.labels.length,
  };

  addLabel = () => {
    let labels = this.state.labels;
    console.log('adding new label', labels);
    const n = labels.push({ name: '', value: '' });

    this.setState({ labels: labels, numLabels: n }, this.onUpdate);
  };

  onDelete = (index: number) => {
    let labels = this.state.labels;
    labels.splice(index, 1);
    this.setState({ labels: labels, numLabels: labels.length }, this.onUpdate);
  };

  onUpdate = () => {
    this.props.onUpdate(this.state.labels);
  };

  onChange = (index: number, label: WorldpingLabel) => {
    let labels = this.state.labels;
    labels[index] = label;
    this.setState({ labels: labels }, this.onUpdate);
  };

  render() {
    const { labels } = this.state;
    const { isEditor, limit } = this.props;
    return (
      <VerticalGroup justify="space-between">
        <List
          items={labels}
          renderItem={(item, index) => (
            <WorldpingLabelForm
              onDelete={this.onDelete}
              onChange={this.onChange}
              label={item}
              index={index}
              isEditor={isEditor}
            />
          )}
        />
        {labels.length < limit && (
          <Button onClick={this.addLabel} disabled={!isEditor} variant="secondary" size="sm">
            <Icon name="plus" />
            &nbsp; Add {this.props.type}
          </Button>
        )}
      </VerticalGroup>
    );
  }
}

interface LabelProps {
  label: WorldpingLabel;
  index: number;
  isEditor: boolean;
  onDelete: (index: number) => void;
  onChange: (index: number, label: WorldpingLabel) => void;
}

interface LabelState {
  name: string;
  value: string;
}

export class WorldpingLabelForm extends PureComponent<LabelProps, LabelState> {
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

export const IpOptions = [
  {
    label: 'Any',
    value: IpVersion.Any,
  },
  {
    label: 'V4',
    value: IpVersion.V4,
  },
  {
    label: 'V6',
    value: IpVersion.V6,
  },
];
