'use strict';

var assert = require('hoek').assert;
var _ = require('lodash');

var Errors = require('./errors');

/**
 * Message
 * @class
 * @param {string} key Message routing key
 * @param {Object|String|Number} data Message data
 */
function Message(key, data) {
  assert(_.isString(key), 'Message routing key is not string');

  this.key = key;
  this.data = data;
  this.state = 'new';
  this.options = {};
}

/**
 * Check whether message is new (not sent)
 * @return {boolean} Whether message is new
 */
Message.prototype.isNew = function() {
  return this.state === 'new';
};

/**
 * Checks whether message was already sent
 * @return {boolean} Whether message is sent
 */
Message.prototype.isPublished = function() {
  return this.state === 'published';
};

/**
 * Acknowledges message
 */
Message.prototype.ack = function() {
  throw new Errors.NotImplemented();
};

/**
 * Rejects message and puts is back on the queue for processing if requeue is
 * true
 * @param {boolean} requeue Whether to requeue message
 */
Message.prototype.reject = function(requeue) {
  throw new Errors.NotImplemented();
};

module.exports = Message;
