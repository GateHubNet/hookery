// Tests rabbitmq backend (requires rabbitmq)
'use strict';

var expect = global.expect;

var uuid = require('uuid');
var Promise = require('bluebird');

var RabbitMQ = require('../lib/backends/rabbitmq');
var Message = require('../lib/message');
var Errors = require('../lib/errors');

function createQueueExchangePair(next) {
  var self = this;

  this.exchgName = uuid.v4();
  this.queueName = uuid.v4();

  this.rabbitmq.connection.then(function(conn) {
    conn.exchange(self.exchgName, { confirm: true, autoDelete: true }, function(exchg) {
      conn.queue(self.queueName,  { autoDelete: true }, function(queue) {
        queue.bind(self.exchgName, '#', function() {
          self.queue = queue;
          self.exchg = exchg;
          next();
        });
      });
    });
  });
}

describe('rabbitmq backend', function() {
  it('should connect to rabbitmq', function() {
    var rabbitmq = new RabbitMQ();
    return expect(rabbitmq.connection).to.be.eventually.fulfilled;
  });

  it('should catch failed connection', function(next) {
    var rabbitmq = new RabbitMQ({host: 'hacker.com',connectionTimeout: 10}, {reconnect: false});

    rabbitmq.on('error', function(err) {
      expect(err).to.be.instanceOf(Errors.ConnectionError);
      next();
    });
  });

  describe('sink', function() {
    beforeEach(function() {
      this.rabbitmq = new RabbitMQ();
    });

    beforeEach(createQueueExchangePair);

    it('should create exchange', function(next) {
      var sink = this.rabbitmq.exchange('test' + uuid.v4());

      sink.on('error', function(error) {
        next(error);
      });

      expect(sink).to.be.instanceOf(RabbitMQ.sink),

      sink.exchange().then(function(exchange) {
        next();
      });
    });

    it('should publish message to exchange', function(next) {
      var self = this;

      this.queue.subscribe(function (message, headers, deliveryInfo, messageObject) {
        expect(deliveryInfo.routingKey).to.equal('test');
        expect(message).to.have.property('test');
      });

      var sink = self.rabbitmq.exchange(self.exchgName);

      sink.on('error', function(error) {
        next(error);
      });

      sink.publish(new Message('test', {test:'test'}))
      .then(function(msg) {
        expect(msg.isPublished()).to.be.true;
        next();
      })
      .catch(function(err) {
        next(err);
      });
    });
  });

  describe('queue', function() {
    beforeEach(function() {
      this.rabbitmq = new RabbitMQ();
    });

    beforeEach(createQueueExchangePair);

    it('should receive message from queue', function(next) {
      var self = this;
      var source = this.rabbitmq
        .queue(uuid.v4(), {'autoDelete': true})
        .bindTo(this.exchgName);

      source.on('message', function(msg) {
        expect(msg.key).to.be.equal('test');
        expect(msg.isPublished()).to.be.equal.true;
        expect(msg.data).to.have.property('test');
        next();
      });

      source.subscribe().then(function() {
        self.exchg.publish('test', {test: 'test'});
      });
    });
  });
});
