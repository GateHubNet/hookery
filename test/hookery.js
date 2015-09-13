'use strict';

var expect = global.expect;
var sionon = global.sinon;

var Promise = require('bluebird');

var Hookery = require('../lib/hookery');
var Source = require('../lib/source');
var Sink = require('../lib/sink');
var Message = require('../lib/message');

describe('hookery', function() {
  it('should construct hookery class', function() {
    new Hookery();
  });

  it('should have rabbitmq attached', function() {
    expect(Hookery).to.have.property('Ampq');
  });

  describe('class', function() {
    beforeEach(function() {
      this.hookery = new Hookery();
    });

    it('should add source', function() {
      var source = new Source();
      this.hookery.from(source);
      expect(this.hookery.sources).to.include(source);
    });

    it('should add sink', function() {
      var sink = new Sink();
      this.hookery.to(sink);
      expect(this.hookery.sinks).to.include(sink);
    });

    it('should add message handler', function() {
      var handler = function() {};
      this.hookery.on('somekey', handler);
      expect(this.hookery.hooks[0].template).to.be.equal('somekey');
      expect(this.hookery.hooks[0].handler).to.be.equal(handler);
    });

    it('should add error handler', function() {
      var handler = function() {};
      this.hookery.on('error', handler);
      expect(this.hookery.errorHandlers).to.include(handler);
    });

    describe('with source', function() {
      beforeEach(function() {
        this.source = new Source();
        this.hookery.from(this.source);
      });

      it('should handle source errors', function(next) {
        var err = new Error();
        this.hookery.on('error', function(err) {
          expect(err).to.be.equal(err);
          next();
        });
        this.source.onError(err);
      });

      it('should recive messages', function(next) {
        var msg = new Message('some.key', 'data');

        this.hookery.on('some.key', function(rmsg) {
          expect(rmsg).to.be.equal(msg);
          next();
        });

        this.source.onMessage(msg);
      });
    });

    describe('with sink', function() {
      beforeEach(function() {
        this.sink = new Sink();
        sinon.stub(this.sink, 'publish').returns(Promise.resolve());
        this.hookery.to(this.sink);
      });

      it('should handle sink errors', function(next) {
        var err = new Error();
        this.hookery.on('error', function(err) {
          expect(err).to.be.equal(err);
          next();
        });
        this.sink.onError(err);
      });

      it('should send message', function(next) {
        var self = this;
        var msg = new Message('some.key', 'somedata');

        var result = this.hookery.emit(msg);

        result.then(function() {
          expect(self.sink.publish).called;
          expect(self.sink.publish.args[0][0].key).to.be.equal('some.key');
          expect(self.sink.publish.args[0][0].data).to.be.equal('somedata');
          next();
        });

        expect(result).to.be.instanceOf(Promise);
      });

      it('should send message as key value', function(next) {
        var self = this;
        var result = this.hookery.emit('some.key', 'somedata');

        result.then(function() {
          expect(self.sink.publish).called;
          expect(self.sink.publish.args[0][0].key).to.be.equal('some.key');
          expect(self.sink.publish.args[0][0].data).to.be.equal('somedata');
          next();
        });

        expect(result).to.be.instanceOf(Promise);
      });
    });

  });
});
