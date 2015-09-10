'use strict';

var EventEmitter = require('events').EventEmitter;
var Util = require('util');

var Helpers = require('./lib');
var Errors = require('./errors');

/**
 * Message sink
 * @constructor
 */
function Sink() {
  this._key = '*';
  this._cast = null;
}
Util.inherits(Sink, EventEmitter);

/**
 * Sets the key that sink should match to send message
 * @param {string} key Template to match
 * @return {Object} Sink
 */
Sink.prototype.key = function(key) {
  this._key = key;
  return this;
};

/**
 * Match message with a sink
 * @param {Object} Message instance
 */
Sink.prototype.match = function(msg) {
  return Helpers.match(this._key, msg.key());
};

/**
 * Publish message down the sink
 * @param {Object} Message instance
 * @return {Promise}
 */
Sink.prototype.publish = function(msg) {
  throw new Error('Not implemented');
};

/**
 * Function to be executed when error is triggered
 */
Sink.prototype.onError = function(err) {
  this.emit('error', err);
};

module.exports = Sink;
