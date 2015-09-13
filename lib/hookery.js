/**
 * Hookery.js
 * @module Hookery
 */

'use strict';

var Promise = require('bluebird');
var Hoek = require('hoek');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var assert = Hoek.assert;

var Hook = require('./hook');
var Message = require('./message');

var Ampq = require('./backends/ampq');

/**
 * Hookery class
 *
 * ```
 * var hook = new Hookery();
 * ```
 *
 * @class
 */
function Hookery(options) {
  EventEmitter.call(this);

  options = options || {};

  this.sources = [];
  this.sinks = [];
  this.hooks = [];
  this.errorHandlers = [];
}

Hookery.prototype.onMessage = function(msg) {
  _.each(this.hooks, function(hook) {
    var match = hook.match(msg.key);
    if (match) {
      return hook.handler(msg, match);
    }
  });
};

/**
 * Subscribes hookery to messages from source
 *
 * ```
 * hook.from(ampq.queue('bunnies').bindTo('bunnies'));
 * ```
 *
 * @param {Source} source Message source
 */
Hookery.prototype.from = function(source) {
  var self = this;

  this.sources.push(source);

  source.on('message', function(msg) {
    self.onMessage(msg);
  });

  source.on('error', function(err) {
    _.each(self.errorHandlers, function(handler) {
      handler(err);
    });
  });
};

/**
 * Adds hookery message sink
 *
 * ```
 * hook.to(rabbit.exchange('bunnies').durable().key('bunnies.*'));
 * ```
 *
 * @param {Sink} sink Message sink
 */
Hookery.prototype.to = function(sink) {
  var self = this;

  this.sinks.push(sink);

  sink.on('error', function(err) {
    _.all(self.errorHandlers, function(handler) {
      handler(err);
    });
  });
};

/**
 * Subscribes for messages
 *
 * ```
 * hook.on('some.{message}.key', function(msg, matchKey) {
 *   console.log('Received message with key: ' + msg.key + ' and data:
 *  ' + msg.data);
 *   console.log('You message embedded in key is: ' + matchKey.message);
 * });
 *
 * hook.on('error', function(err) {
 *   throw err;
 * });
 * ```
 *
 * @param {key} key Message keys to subscribe to or `error` to subscribe on
 * error events.
 *
 * This parameter can be in fromat of `some.key.{match}`
 *
 * @param {function} handler Event handler
 */
Hookery.prototype.on = function(key, handler) {
  if (key === 'error') {
    return this.errorHandlers.push(handler);
  }

  this.hooks.push(new Hook(key, handler));
};

Hookery.prototype.emit = function() {
  var msg;

  if (arguments[0] instanceof Message) {
    msg = arguments[0];
  } else {
    msg = new Message(arguments[0], arguments[1]);
  }

  return Promise.each(this.sinks, function(sink) {
    return sink.publish(msg);
  });
};

// Attach all backends to Hookery class
Hookery.Ampq = Ampq;

module.exports = Hookery;
