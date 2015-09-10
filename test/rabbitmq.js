// Tests ampq backend (requires ampq)
'use strict';

var expect = global.expect;

var uuid = require('uuid');
var Promise = require('bluebird');

var Ampq = require('../lib/backends/ampq');
var Message = require('../lib/message');
var Errors = require('../lib/errors');

function createQueueExchangePair(next) {
  var self = this;

  this.exchgName = uuid.v4();
  this.queueName = uuid.v4();

  this.ampq.connection.then(function(conn) {
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

describe('ampq backend', function() {
  it('should connect to ampq', function() {
    var ampq = new Ampq();
    return expect(ampq.connection).to.be.eventually.fulfilled;
  });

  it('should catch failed connection', function(next) {
    var ampq = new Ampq({host: 'hacker.com',connectionTimeout: 10}, {reconnect: false});

    ampq.on('error', function(err) {
      expect(err).to.be.instanceOf(Errors.ConnectionError);
      next();
    });
  });

  describe('sink', function() {
    beforeEach(function() {
      this.ampq = new Ampq();
    });

    beforeEach(createQueueExchangePair);

    it('should create exchange', function(next) {
      var sink = this.ampq.exchange('test' + uuid.v4());

      sink.on('error', function(error) {
        next(error);
      });

      expect(sink).to.be.instanceOf(Ampq.sink),

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

      var sink = self.ampq.exchange(self.exchgName);

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
      this.ampq = new Ampq();
    });

    beforeEach(createQueueExchangePair);

    it('should receive message from queue', function(next) {
      var self = this;
      var source = this.ampq
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
