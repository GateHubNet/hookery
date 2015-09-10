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

var RabbitMQ = require('./backends/rabbitmq');

/**
 * Hookery constructor
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
  Promise.all(this.hooks, function(hook) {
    if (hook.matches(msg.key())) {
      return hook.handler(msg);
    }
  });
};

Hookery.prototype.from = function(source) {
  var self = this;

  this.sources.append(source);

  source.on('message', function(msg) {
    self.onMessage(msg);
  });

  source.on('error', function(err) {
    _.all(self.errorHandlers, function(handler) {
      handler(err);
    });
  });
};

Hookery.prototype.on = function(key, handler) {
  if (key === 'error') {
    return this.errorHandlers.push(handler);
  }

  this.hooks.push(Hook(key, handler));
};

Hookery.prototype.emit = function() {
  var msg;

  if (arguments[0] instanceof Message) {
    msg = arguments[0];
  } else {
    msg = Message(arguments[0], arguments[1]);
  }

  return Promise.all(this.sinks, function(sink) {
    return sink.publish(msg);
  });
};

// Attach all backends to Hookery class
Hookery.RabbitMQ = RabbitMQ;

module.exports = Hookery;
