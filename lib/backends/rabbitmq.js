'use strict';

var Util = require('util');
var Amqp = require('amqp');
var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var Util = require('util');
var _ = require('lodash');

var Sink = require('../sink');
var Source = require('../source');
var Message = require('../message');
var Errors = require('../errors');

function RabbitMQMessage(message, messageObject, options) {
  this.message = message;
  this.messageObject = messageObject;
  this.options = options;
  this.state = 'published';
  this.key = messageObject.routingKey;
  this.data = message;
}
Util.inherits(RabbitMQMessage, Message);

RabbitMQMessage.prototype.ack = function() {
  this.messageObject.acknowledge();
};

RabbitMQMessage.prototype.reject = function(requeue) {
  this.messageObject.reject(requeue || this.options.requeue);
};

function RabbitMQSink(amqp, name, options) {
  var self = this;

  this.amqp = amqp;
  this.name = name;
  this.options = options || { autoDelete: true };
  this.messageDefaultOptions = {};

  this.amqp.connection.then(function(conn) {
    conn.on('error', function(err) {
      self.onError(err);
    });
  });
}
Util.inherits(RabbitMQSink, Sink);

RabbitMQSink.prototype.exchange = function() {
  var self = this;

  var options = _.merge(this.options, { confirm: true });

  if (this._exchange) {
    return this._exchange;
  } else {
    return new Promise(function(res, rej) {
      self.amqp.connection.then(function(conn) {
        conn.exchange(self.name, options, function(exchange) {
          self._exchange = exchange;
          res(exchange);
        });
      });
    });
  }
};

RabbitMQSink.prototype.publish = function(msg, options) {
  var self = this;
  options = _.merge(this.messageDefaultOptions, options);

  return this.exchange().then(function(exchange) {
    return new Promise(function(res, rej) {
      exchange.publish(msg.key, msg.data, options, function(err) {
        if (err) {
          return rej(new Errors.MessageError(msg));
        }

        msg.state = 'published'; // Mark message as published
        msg.sink = self;
        res(msg);
      });
    });
  });
};

/**
 * Marks rabbitmq exchange as durable
 */
RabbitMQSink.prototype.durable = function() {
  this.options.durable = true;
  return this;
};

/**
 * Marks rabbitmq exchange messages as persistant
 */
RabbitMQSink.prototype.persistent = function() {
  this.messageDefaultOptions.deliveryMode = 2;
  return this;
};

function RabbitMQSource(amqp, name, options) {
  var self = this;

  this.amqp = amqp;
  this.name = name;
  this.options = options || { autoDelete: true };
  this.subscribeOptions = {};
  this.messageOptions = {};
  this._bindTo = '#';

  this.amqp.connection.then(function(conn) {
    conn.on('error', function(err) {
      self.onError(err);
    });
  });
}

Util.inherits(RabbitMQSource, Source);

RabbitMQSource.prototype.queue = function() {
  var self = this;
  if (this._queue) {
    return this._queue;
  } else {
    return new Promise(function(res, rej) {
      self.amqp.connection.then(function(conn) {
        conn.queue(self.name, self.options, function(queue) {
          self._queue = queue;
          res(queue);
        });
      });
    });
  }
};

RabbitMQSource.prototype.subscribe = function() {
  var self = this;

  return this.queue().then(function(queue) {
    return new Promise(function(res, rej) {
      queue.bind(
        self._exchange || 'amq.topic',
        self._bindTo || '#',
        function(ok) {
          var options = _.merge(self.subscribeOptions, {});

          queue.subscribe(
            options, function(message, headers, deliveryInfo, messageObject) {
              self.onMessage(
                new RabbitMQMessage(message, messageObject, self.messageOptions)
              );
            }
          );

          res();
        }
      );
    });
  });
};

RabbitMQSource.prototype.bindTo = function(exchange, key) {
  this._exchange = exchange;
  this._bindTo = key;
  return this;
};

/**
 * Prefetch messages from queue
 */
RabbitMQSource.prototype.durable = function() {
  this.options.durable = true;
  return this;
};

/**
 * Marks rabbitmq exchange messages as persistant
 */
RabbitMQSource.prototype.ack = function() {
  this.subscribeOptions.ack = true;
  return this;
};

/**
 * Sets the number of messages to prefetch from rabbitmq queue
 * @param {number=} [count=1] Number of messages to prefetch
 */
RabbitMQSource.prototype.prefetch = function(count) {
  this.subscribeOptions.prefetchCount = count || 1;
};

/**
 * RabbitMQ class constructor
 * @param {Object} config RabbitMQ connection config
 *  {@link https://github.com/postwait/node-amqp#connection options}
 */
function RabbitMQ(config, otherConfig) {
  var self = this;

  var connection = Amqp.createConnection(
    config || {url: 'amqp://guest:guest@localhost:5672'},
    otherConfig || {}
  );
  this.connection = new Promise(function(res, rej) {
    connection.on('ready', function() {
      res(connection);
    });

    connection.on('error', function(err) {
      self.emit('error', new Errors.ConnectionError(err));
    });
  });
}
Util.inherits(RabbitMQ, EventEmitter);

/**
 * Gets rabbitmq exchange object
 * @param {string} name Exchange name
 * @param {Object=} options Exchange
 *  {@link https://github.com/postwait/node-amqp#connectionexchangename-options-opencallback options}
 * @return {RabbitMQSink} sink object usable with hookery
 */
RabbitMQ.prototype.exchange = function(name, options) {
  return new RabbitMQSink(this, name, options);
};

/**
 * Gets rabbitmq queue object
 * @param {string} name Queue name
 * @param {Object=} options Queue
 *  {@link https://github.com/postwait/node-amqp#connectionqueuename-options-opencallback options}
 * @return {RabbitMQSource} source object usable with hookery
 */
RabbitMQ.prototype.queue = function(name, options) {
  return new RabbitMQSource(this, name, options);
};

RabbitMQ.sink = RabbitMQSink;
RabbitMQ.source = RabbitMQSource;

module.exports = RabbitMQ;
