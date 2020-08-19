import React, { PureComponent } from 'react';
import { Icon, List, VerticalGroup, Button } from '@grafana/ui';
import { Label } from 'types';
import SMLabel from './SMLabel';

interface Props {
  labels: Label[];
  isEditor: boolean;
  type: string;
  limit: number;
  onUpdate: (labels: Label[]) => void;
}

interface State {
  labels: Label[];
  numLabels: number;
}

export default class SMLabelsForm extends PureComponent<Props, State> {
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

  onChange = (index: number, label: Label) => {
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
            <SMLabel onDelete={this.onDelete} onChange={this.onChange} label={item} index={index} isEditor={isEditor} />
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
