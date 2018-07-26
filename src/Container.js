import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import raf from 'raf';

export default class Container extends PureComponent {

  static childContextTypes = {
    subscribe: PropTypes.func,
    unsubscribe: PropTypes.func,
    getParent: PropTypes.func,
    forceUpdate: PropTypes.func,
  }

  getChildContext() {
    return {
      subscribe: this.subscribe,
      unsubscribe: this.unsubscribe,
      getParent: this.getParent,
      forceUpdate: this.forceUpdate,
    };
  }

  events = [
    'resize',
    'scroll',
    'touchstart',
    'touchmove',
    'touchend',
    'pageshow',
    'load'
  ]

  subscribers = [];

  subscribe = handler => {
    this.subscribers = this.subscribers.concat(handler);
  }

  unsubscribe = handler => {
    this.subscribers = this.subscribers.filter(current => current !== handler);
  }

  forceUpdate = () => {
    return this.notifySubscribers({})
  }

  notifySubscribers = currentTarget => {
      this.framePending = false;
      const { top, bottom } = this.node.getBoundingClientRect();

      this.subscribers.forEach(handler => handler({
          distanceFromTop: top,
          distanceFromBottom: bottom,
          eventSource: currentTarget === window ? document.body : this.node
      }))
  }

  handleEvent = evt => {
    if (this.framePending) {
        return
    }

    const { currentTarget } = evt;

    raf(() => {
        this.node && this.notifySubscribers(currentTarget);
    });

    this.framePending = true;
  }

  getParent = () => this.node

  componentDidMount() {
    this.events.forEach(event => window.addEventListener(event, this.handleEvent))
    this.notifySubscribers();
  }

  componentWillUnmount() {
    this.events.forEach(event => window.removeEventListener(event, this.handleEvent))
  }

  render() {
    return (
      <div
        { ...this.props }
        ref={ node => this.node = node }
        onScroll={this.handleEvent}
        onTouchStart={this.handleEvent}
        onTouchMove={this.handleEvent}
        onTouchEnd={this.handleEvent}
      />
    );
  }
}
