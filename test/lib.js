'use strict';

var lib = require('../lib/lib');

describe('lib', function(){
  describe('match', function() {
    it('should match exactly', function() {
      expect(lib.match('a.b.c', 'a.b.c')).to.be.empty;
    });

    it('should not match partially', function() {
      expect(lib.match('a.b.c', 'a.b')).to.be.equal(null);
    });

    it('should match everything', function() {
      expect(lib.match('*', 'some.key')).to.be.empty;
    });

    it('should match everything in place', function() {
      expect(lib.match('*.*.c', 'a.b.c')).to.be.empty;
    });

    it('should save match', function() {
      var match = lib.match('a.b.{c}', 'a.b.value');
      expect(match).to.have.property('c');
      expect(match.c).to.be.equal('value');
    });

    it('should save match at the end', function() {
      var match = lib.match('a.b.{*c}', 'a.b.c.d');
      expect(match).to.have.property('c');
      expect(match.c).to.be.equal('c.d');
    });
  });
});
