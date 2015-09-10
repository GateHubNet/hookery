'use strict';

var EventEmitter = require('events').EventEmitter;
var Util = require('util');

var Errors = require('./errors');

/**
 * Message source
 * @class
 */
function Source() {}
Util.inherits(Source, EventEmitter);

/**
 * Subscribes source for messages
 */
Source.prototype.subscribe = function(options) {
  throw new Errors.NotImplemented();
};

// Function to be executed when new message arrives
Source.prototype.onMessage = function(msg) {
  if (this.castTo) {
    this.emit('message', new this.castTo(msg));
  } else {
    this.emit('message', msg);
  }
};

/**
 * Function to be executed when error is triggered
 */
Source.prototype.onError = function(err) {
  this.emit('error', err);
};

// Sets to which type to cast received messages
Source.prototype.cast = function(type) {
  this.castTo = type;
  return this;
};

module.exports = Source;
