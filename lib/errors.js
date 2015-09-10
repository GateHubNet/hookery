/**
 * Errors.js
 * @module Hookery.Errors
 */

'use strict';

var Util = require('util');

function WrapError() {
    this.name = 'Error';
    this.message = '';
    this.err = undefined;
    this.data = undefined;
}

WrapError.prototype = Error.prototype;

WrapError.prototype.getData = function() {
  return {
    name: this.name,
    msg: this.message,
    err: this.err ? this.err.toString() : this.err,
    data: this.data
  };
};

/**
 * Error thrown for not functions not being implemented
 * @class
 */
function NotImplemented() {
  this.name = 'NotImplemented';
}
Util.inherits(ConnectionError, WrapError);

/**
 * Error thrown if there's an error in amqp connection
 * @class
 */
function ConnectionError(err, message) {
  this.name = 'ConnectionError';
  this.err = err;
  this.message = message;
}
Util.inherits(ConnectionError, WrapError);

/**
 * Error thrown if there was error related to sending a message
 * @class
 */
function MessageError(message) {
  this.name = 'MessageError';
  this.message = message;
}
Util.inherits(MessageError, WrapError);

module.exports = {
  ConnectionError: ConnectionError,
  MessageError : MessageError
};
