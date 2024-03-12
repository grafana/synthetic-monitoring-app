import { SceneFlexItem, SceneFlexLayout, SceneObject, SceneObjectBase, SceneObjectState } from '@grafana/scenes';

/**
 * Just a proof of concept example of a behavior
 */
export class HiddenLayoutItemBehavior<
  TState extends SceneObjectState = SceneObjectState
> extends SceneObjectBase<TState> {
  public constructor(state: TState) {
    super(state);
  }

  protected setHidden() {
    const parentLayoutItem = getClosestLayoutItem(this);
    if (!parentLayoutItem) {
      return;
    }

    if (!parentLayoutItem.state.isHidden) {
      parentLayoutItem.setState({ isHidden: true });
    }
  }

  protected setVisible() {
    const parentLayoutItem = getClosestLayoutItem(this);
    if (!parentLayoutItem) {
      return;
    }

    if (parentLayoutItem.state.isHidden) {
      parentLayoutItem.setState({ isHidden: false });
    }
  }
}

function getClosestLayoutItem(obj: SceneObject): SceneFlexItem | SceneFlexLayout | undefined {
  if (obj instanceof SceneFlexItem || obj instanceof SceneFlexLayout) {
    return obj;
  }

  if (!obj.parent) {
    return;
  }

  return getClosestLayoutItem(obj.parent);
}
