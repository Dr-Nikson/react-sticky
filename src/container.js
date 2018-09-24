import React from 'react';
import ReactDOM from 'react-dom';

import Channel from './channel';

export default class Container extends React.Component {

  static contextTypes = {
    'sticky-channel': React.PropTypes.any,
  }

  static childContextTypes = {
    'sticky-channel': React.PropTypes.any,
  }

  constructor(props) {
    super(props);

    this.channel = new Channel({ inherited: 0, offset: 0, node: null });
    this.rect = {}
  }

  getChildContext() {
    return { 'sticky-channel': this.channel };
  }

  componentWillMount() {
    const parentChannel = this.context['sticky-channel'];
    if (parentChannel) parentChannel.subscribe(this.updateOffset);
  }

  componentWillUnmount() {
    this.channel.update((data) => { data.node = null });

    const parentChannel = this.context['sticky-channel'];
    if (parentChannel) parentChannel.unsubscribe(this.updateOffset);
  }

  componentDidUpdate() {
    const node = ReactDOM.findDOMNode(this);
    const nextRect = node.getBoundingClientRect()
    // Have we changed any prop values?
    // Somehow Object.keys(this.rect) returns [] O_O
    const valuesMatch = ['top', 'bottom', 'left', 'right'].every((key) => {
      return nextRect.hasOwnProperty(key) && nextRect[key] === this.rect[key];
    });

    this.rect = nextRect
    return !valuesMatch && this.channel.update((data) => { data.node = node });
  }

  updateOffset = ({ inherited, offset, scrollableTarget }) => {
    this.channel.update((data) => {
      data.inherited = inherited + offset

      ! data.scrollableTarget && this.handleNodeRef(data.node);
    });
  }

  handleNodeRef = node => {
    const { useContainerAsTarget } = this.props;
    const parentChannel = this.context['sticky-channel'];

    this.channel.update((data) => {
      data.node = node;

      const parentScrollableTarget = (
        parentChannel && parentChannel.getCurrentData().scrollableTarget
      );


      if (parentChannel && ! parentScrollableTarget) {
        return;
      }

      const defaultNode = parentScrollableTarget || window;

      data.scrollableTarget = useContainerAsTarget ? node : defaultNode;
    });

    node && (this.rect = node.getBoundingClientRect());
  }

  render() {
    const { useContainerAsTarget, ...rest } = this.props;

    return (
      <div ref={this.handleNodeRef} {...rest}>
        {this.props.children}
      </div>
    )
  }
}
