'use strict';

var Helpers = require('./lib');

function Hook(template, handler) {
  this.template = template;
  this.handler = handler;
}

// Match the routing template
Hook.prototype.match = function(key) {
  return Helpers.match(this.template, key);
};

module.exports = Hook;
